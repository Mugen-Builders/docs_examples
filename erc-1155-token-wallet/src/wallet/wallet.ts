import type { Voucher } from "@cartesi/rollup";
import {
  type Address,
  decodeAbiParameters,
  encodeFunctionData,
  erc1155Abi,
  getAddress,
  type Hex,
  sliceHex,
} from "viem";
import { Balance } from "./balance";

export class Wallet {
  private accounts: Map<Address, Balance> = new Map();

  private getOrCreate(account: Address): Balance {
    const key = getAddress(account);
    let balance = this.accounts.get(key);
    if (!balance) {
      balance = new Balance(key);
      this.accounts.set(key, balance);
    }
    return balance;
  }

  getBalance(account: Address, erc1155: Address, tokenId: bigint): bigint {
    return this.getOrCreate(account).getAmount(erc1155, tokenId);
  }

  listBalances(account: Address, erc1155: Address) {
    return {
      address: account,
      erc1155,
      holdings: this.getOrCreate(account).listIds(erc1155),
    };
  }

  processSingleDeposit(payload: Hex): string {
    const [erc1155, account, tokenId, amount] =
      this.parseSingleDeposit(payload);
    return this.deposit(
      account,
      erc1155,
      tokenId,
      amount,
      "erc1155SingleDeposit",
    );
  }

  processBatchDeposit(payload: Hex): string {
    const [erc1155, account, tokenIds, amounts] =
      this.parseBatchDeposit(payload);
    const balance = this.getOrCreate(account);
    tokenIds.forEach((tokenId, i) => {
      balance.increase(erc1155, tokenId, amounts[i] ?? 0n);
    });
    return JSON.stringify({
      type: "erc1155BatchDeposit",
      content: {
        address: account,
        erc1155,
        tokenIds: tokenIds.map((id) => id.toString()),
        amounts: amounts.map((a) => a.toString()),
      },
    });
  }

  private parseSingleDeposit(
    payload: Hex,
  ): [Address, Address, bigint, bigint] {
    const erc1155 = getAddress(sliceHex(payload, 0, 20));
    const account = getAddress(sliceHex(payload, 20, 40));
    const tokenId = BigInt(sliceHex(payload, 40, 72));
    const amount = BigInt(sliceHex(payload, 72, 104));
    return [erc1155, account, tokenId, amount];
  }

  private parseBatchDeposit(
    payload: Hex,
  ): [Address, Address, bigint[], bigint[]] {
    const erc1155 = getAddress(sliceHex(payload, 0, 20));
    const account = getAddress(sliceHex(payload, 20, 40));
    const [tokenIds, amounts] = decodeAbiParameters(
      [
        { type: "uint256[]" },
        { type: "uint256[]" },
        { type: "bytes" },
        { type: "bytes" },
      ],
      sliceHex(payload, 40),
    );
    return [erc1155, account, [...tokenIds], [...amounts]];
  }

  private deposit(
    account: Address,
    erc1155: Address,
    tokenId: bigint,
    amount: bigint,
    noticeType: string,
  ): string {
    this.getOrCreate(account).increase(erc1155, tokenId, amount);
    return JSON.stringify({
      type: noticeType,
      content: {
        address: account,
        erc1155,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
      },
    });
  }

  transferSingle(
    from: Address,
    to: Address,
    erc1155: Address,
    tokenId: bigint,
    amount: bigint,
  ): string {
    const fromBal = this.getOrCreate(from);
    const toBal = this.getOrCreate(to);
    fromBal.decrease(erc1155, tokenId, amount);
    toBal.increase(erc1155, tokenId, amount);
    return JSON.stringify({
      type: "erc1155SingleTransfer",
      content: {
        from,
        to,
        erc1155,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
      },
    });
  }

  transferBatch(
    from: Address,
    to: Address,
    erc1155: Address,
    tokenIds: bigint[],
    amounts: bigint[],
  ): string {
    if (tokenIds.length !== amounts.length) {
      throw new Error("tokenIds and amounts length mismatch");
    }
    const fromBal = this.getOrCreate(from);
    const toBal = this.getOrCreate(to);
    tokenIds.forEach((tokenId, i) => {
      const amount = amounts[i] ?? 0n;
      fromBal.decrease(erc1155, tokenId, amount);
      toBal.increase(erc1155, tokenId, amount);
    });
    return JSON.stringify({
      type: "erc1155BatchTransfer",
      content: {
        from,
        to,
        erc1155,
        tokenIds: tokenIds.map((id) => id.toString()),
        amounts: amounts.map((a) => a.toString()),
      },
    });
  }

  withdrawSingle(
    application: Address,
    account: Address,
    erc1155: Address,
    tokenId: bigint,
    amount: bigint,
  ): Voucher {
    this.getOrCreate(account).decrease(erc1155, tokenId, amount);
    const call = encodeFunctionData({
      abi: erc1155Abi,
      functionName: "safeTransferFrom",
      args: [application, account, tokenId, amount, "0x"],
    });
    return { destination: erc1155, value: 0n, payload: call };
  }

  withdrawBatch(
    application: Address,
    account: Address,
    erc1155: Address,
    tokenIds: bigint[],
    amounts: bigint[],
  ): Voucher {
    if (tokenIds.length !== amounts.length) {
      throw new Error("tokenIds and amounts length mismatch");
    }
    const balance = this.getOrCreate(account);
    tokenIds.forEach((tokenId, i) => {
      balance.decrease(erc1155, tokenId, amounts[i] ?? 0n);
    });
    const call = encodeFunctionData({
      abi: erc1155Abi,
      functionName: "safeBatchTransferFrom",
      args: [application, account, tokenIds, amounts, "0x"],
    });
    return { destination: erc1155, value: 0n, payload: call };
  }
}

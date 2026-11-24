import type { Voucher } from "@cartesi/rollup";
import {
  type Address,
  encodeFunctionData,
  erc721Abi,
  getAddress,
  type Hex,
  sliceHex,
} from "viem";
import { Balance } from "./balance";

export class Wallet {
  private accounts: Map<Address, Balance> = new Map();

  private getOrCreateBalance(address: Address): Balance {
    const key = getAddress(address);
    let balance = this.accounts.get(key);
    if (!balance) {
      balance = new Balance(key, new Map());
      this.accounts.set(key, balance);
    }
    return balance;
  }

  getBalance(address: Address): Balance {
    return this.getOrCreateBalance(address);
  }

  getErc721Balance(
    address: Address,
    erc721: Address,
  ): { address: string; erc721: string; tokenIds: string[] } {
    const balance = this.getOrCreateBalance(address);
    const tokens = balance.getErc721Tokens(erc721) || new Set<bigint>();
    const tokenIdsArray = Array.from(tokens, (id) => id.toString());

    const result = {
      address: address,
      erc721: erc721,
      tokenIds: tokenIdsArray,
    };

    console.info(
      `ERC721 balance for ${address} and contract ${erc721}: ${JSON.stringify(result)}`,
    );
    return result;
  }

  processErc721Deposit(payload: Hex): string {
    const [erc721, account, tokenId] = this.parseErc721Deposit(payload);
    console.info(
      `Token ERC-721 ${erc721} id: ${tokenId} deposited in ${account}`,
    );
    return this.depositErc721(account, erc721, tokenId);
  }

  private parseErc721Deposit(payload: Hex): [Address, Address, bigint] {
    const erc721 = getAddress(sliceHex(payload, 0, 20));
    const account = getAddress(sliceHex(payload, 20, 40));
    const tokenId = BigInt(sliceHex(payload, 40, 72));
    return [erc721, account, tokenId];
  }

  private depositErc721(
    account: Address,
    erc721: Address,
    tokenId: bigint,
  ): string {
    const balance = this.getOrCreateBalance(account);
    balance.addErc721Token(erc721, tokenId);
    const noticePayload = {
      type: "erc721deposit",
      content: {
        address: account,
        erc721: erc721,
        tokenId: tokenId.toString(),
      },
    };
    return JSON.stringify(noticePayload);
  }

  withdrawErc721(
    application: Address,
    account: Address,
    erc721: Address,
    tokenId: bigint,
  ): Voucher {
    const balance = this.getOrCreateBalance(account);
    balance.removeErc721Token(erc721, tokenId);
    const call = encodeFunctionData({
      abi: erc721Abi,
      functionName: "safeTransferFrom",
      args: [application, account, tokenId],
    });
    console.log("Voucher creation success", {
      destination: erc721,
      payload: call,
    });

    return {
      destination: erc721,
      value: 0n,
      payload: call,
    };
  }

  transferErc721(
    from: Address,
    to: Address,
    erc721: Address,
    tokenId: bigint,
  ): string {
    const balanceFrom = this.getOrCreateBalance(from);
    const balanceTo = this.getOrCreateBalance(to);
    balanceFrom.removeErc721Token(erc721, tokenId);
    balanceTo.addErc721Token(erc721, tokenId);
    const noticePayload = {
      type: "erc721transfer",
      content: {
        from: from,
        to: to,
        erc721: erc721,
        tokenId: tokenId.toString(),
      },
    };
    console.info(
      `Token ERC-721 ${erc721} id:${tokenId} transferred from ${from} to ${to}`,
    );
    return JSON.stringify(noticePayload);
  }
}

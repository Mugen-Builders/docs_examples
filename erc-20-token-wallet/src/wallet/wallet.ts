import type { Voucher } from "@cartesi/rollup";
import {
  type Address,
  encodeFunctionData,
  erc20Abi,
  getAddress,
  type Hex,
  sliceHex,
} from "viem";
import { Balance } from "./balance";

export class Wallet {
  private accounts: Map<Address, Balance> = new Map();

  private getBalance = (account: Address): Balance => {
    const key = getAddress(account);
    let balance = this.accounts.get(key);
    if (!balance) {
      balance = new Balance(key, new Map());
      this.accounts.set(key, balance);
    }
    return balance;
  };

  getAccountBalance = (account: Address, erc20: Address): bigint => {
    const balance = this.getBalance(account);
    const erc20Balance = balance.getErc20Balance(getAddress(erc20)) ?? 0n;
    console.info(
      `Balance for ${account} and token ${erc20} retrieved as ${erc20Balance}`,
    );
    return erc20Balance;
  };

  processErc20Deposit = (payload: Hex): string => {
    const [erc20, account, amount] = this.parseErc20Deposit(payload);
    console.log(`${amount} ${erc20} tokens deposited to account ${account}`);
    return this.depositErc20(account, erc20, amount);
  };

  private parseErc20Deposit = (payload: Hex): [Address, Address, bigint] => {
    const erc20 = getAddress(sliceHex(payload, 0, 20));
    const account = getAddress(sliceHex(payload, 20, 40));
    const amount = BigInt(sliceHex(payload, 40, 72));
    return [erc20, account, amount];
  };

  private depositErc20 = (
    account: Address,
    erc20: Address,
    amount: bigint,
  ): string => {
    const balance = this.getBalance(account);
    balance.increaseErc20Balance(erc20, amount);
    const noticePayload = {
      type: "erc20deposit",
      content: {
        address: account,
        erc20: erc20,
        amount: amount.toString(),
      },
    };
    return JSON.stringify(noticePayload);
  };

  withdrawErc20 = (
    account: Address,
    erc20: Address,
    amount: bigint,
  ): Voucher => {
    const balance = this.getBalance(account);
    balance.decreaseErc20Balance(erc20, amount);
    const call = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [account, amount],
    });

    console.log("Voucher creation success", {
      destination: erc20,
      payload: call,
    });

    return {
      destination: erc20,
      value: 0n,
      payload: call,
    };
  };

  transferErc20 = (
    from: Address,
    to: Address,
    erc20: Address,
    amount: bigint,
  ): string => {
    const balanceFrom = this.getBalance(from);
    const balanceTo = this.getBalance(to);
    balanceFrom.decreaseErc20Balance(erc20, amount);
    balanceTo.increaseErc20Balance(erc20, amount);
    const noticePayload = {
      type: "erc20transfer",
      content: {
        from: from,
        to: to,
        erc20: erc20,
        amount: amount.toString(),
      },
    };
    console.info(`${amount} ${erc20} tokens transferred from ${from} to ${to}`);
    return JSON.stringify(noticePayload);
  };
}

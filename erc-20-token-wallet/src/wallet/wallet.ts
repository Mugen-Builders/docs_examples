import { Address, getAddress, encodeFunctionData } from "viem";
import { ethers } from "ethers";
import { Balance } from "./balance";
import { erc20Abi } from "viem";
import { Voucher } from "..";

export class Wallet {
  static accounts: Map<Address, Balance>;

  constructor() {
    Wallet.accounts = new Map<Address, Balance>();
  }

  private getBalance = (account: Address): Balance => {
    let balance = Wallet.accounts.get(account);
    if (!balance) {
      balance = new Balance(account, new Map());
      Wallet.accounts.set(account, balance);
    }
    return balance;
  };

  getAccountBalance = (
    account: Address,
    erc20: Address
  ): bigint | undefined => {
    const balance = this.getBalance(account);
    const erc20Balance = balance.getErc20Balance(erc20);
    console.info(
      `Balance for ${account} and token ${erc20} retrieved as ${erc20Balance}`
    );
    return erc20Balance;
  };

  processErc20Deposit = (payload: string): string => {
    try {
      let [erc20, account, amount] = this.parseErc20Deposit(payload);
      console.log(`${amount} ${erc20} tokens deposited to account ${account}`);
      return this.depositErc20(account, erc20, amount);
    } catch (e) {
      return `Error depositing ERC20 tokens: ${e}`;
    }
  };

  private parseErc20Deposit = (payload: string): [Address, Address, bigint] => {
    try {
      let inputData = [];
      inputData[0] = ethers.dataSlice(payload, 0, 20);
      inputData[1] = ethers.dataSlice(payload, 20, 40);
      inputData[2] = ethers.dataSlice(payload, 40, 72);

      return [
        getAddress(inputData[0]),
        getAddress(inputData[1]),
        BigInt(inputData[2]),
      ];
    } catch (e) {
      throw new Error(`Error parsing ERC20 deposit: ${e}`);
    }
  };

  private depositErc20 = (
    account: Address,
    erc20: Address,
    amount: bigint
  ): string => {
    let balance = this.getBalance(account);
    balance.increaseErc20Balance(erc20, amount);
    let noticePayload = {
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
    amount: bigint
  ): Voucher => {
    try {
      let balance = this.getBalance(account);
      balance.decreaseErc20Balance(erc20, amount);
      const call = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [account, amount],
      });

      console.log(`Voucher creation success`, {
        destination: erc20,
        payload: call,
      });

      return {
        destination: erc20,
        payload: call,
        value: "0x0",
      };
    } catch (e) {
      throw Error(`Error withdrawing ERC20 tokens: ${e}`);
    }
  };

  transferErc20 = (
    from: Address,
    to: Address,
    erc20: Address,
    amount: bigint
  ): string => {
    try {
      let balanceFrom = this.getBalance(from);
      let balanceTo = this.getBalance(to);
      balanceFrom.decreaseErc20Balance(erc20, amount);
      balanceTo.increaseErc20Balance(erc20, amount);
      let noticePayload = {
        type: "erc20transfer",
        content: {
          from: from,
          to: to,
          erc20: erc20,
          amount: amount.toString(),
        },
      };
      console.info(
        `${amount} ${erc20} tokens transferred from ${from} to ${to}`
      );
      return JSON.stringify(noticePayload);
    } catch (e) {
      throw Error(`Error transferring ERC20 tokens: ${e}`);
    }
  };
}


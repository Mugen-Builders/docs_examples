import type { Voucher } from "@cartesi/rollup";
import { type Address, getAddress, type Hex, sliceHex } from "viem";
import { Balance } from "./balance";

export class Wallet {
  private accounts: Map<Address, Balance> = new Map();

  private getOrCreateBalance(address: Address): Balance {
    const key = getAddress(address);
    let balance = this.accounts.get(key);
    if (!balance) {
      balance = new Balance(key);
      this.accounts.set(key, balance);
    }
    return balance;
  }

  getBalance(address: Address): bigint {
    return this.getOrCreateBalance(address).getEther();
  }

  depositEther(payload: Hex): string {
    const [address, amount] = this.parseDepositPayload(payload);
    const balance = this.getOrCreateBalance(address);
    balance.increaseEther(amount);
    console.log(
      `After deposit, balance for ${address} is ${balance.getEther()}`,
    );
    return JSON.stringify({
      type: "etherDeposit",
      address,
      amount: amount.toString(),
    });
  }

  withdrawEther(address: Address, amount: bigint): Voucher {
    const balance = this.getOrCreateBalance(address);
    balance.decreaseEther(amount);
    console.log(
      `After withdrawal, balance for ${address} is ${balance.getEther()}`,
    );
    return this.encodeWithdrawCall(address, amount);
  }

  transferEther(from: Address, to: Address, amount: bigint): string {
    const fromBalance = this.getOrCreateBalance(from);
    const toBalance = this.getOrCreateBalance(to);
    fromBalance.decreaseEther(amount);
    toBalance.increaseEther(amount);
    console.log(
      `After transfer, balance for ${from} is ${fromBalance.getEther()}`,
    );
    console.log(`After transfer, balance for ${to} is ${toBalance.getEther()}`);
    return JSON.stringify({
      type: "etherTransfer",
      from,
      to,
      amount: amount.toString(),
    });
  }

  private parseDepositPayload(payload: Hex): [Address, bigint] {
    const addressData = sliceHex(payload, 0, 20);
    const amountData = sliceHex(payload, 20, 52);
    return [getAddress(addressData), BigInt(amountData)];
  }

  private encodeWithdrawCall(receiver: Address, amount: bigint): Voucher {
    return {
      destination: receiver,
      value: amount,
      payload: "0x",
    };
  }
}

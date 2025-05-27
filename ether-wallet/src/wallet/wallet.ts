import {
  Address,
  getAddress,
  hexToBytes,
  stringToHex,
  encodeFunctionData,
  numberToHex,
  parseEther
} from "viem";
import { ethers } from "ethers";
import { Balance } from "./balance";
import { CartesiDAppAbi } from "./abi/CartesiDAppAbi";
import { Voucher } from "..";

export class Wallet {
  private accounts: Map<string, Balance> = new Map();

  private getOrCreateBalance(address: Address): Balance {
    const key = address.toLowerCase();
    if (!this.accounts.has(key)) {
      this.accounts.set(key, new Balance(address));
    }
    return this.accounts.get(key)!;
  }

  getBalance(address: Address): bigint {
    return this.getOrCreateBalance(address).getEther();
  }

  depositEther(payload: string): string {
    const [address, amount] = this.parseDepositPayload(payload);
    const balance = this.getOrCreateBalance(address);
    balance.increaseEther(amount);
    console.log(
      `After deposit, balance for ${address} is ${balance.getEther()}`
    );
    return JSON.stringify({
      type: "etherDeposit",
      address,
      amount: amount.toString(),
    });
  }

  withdrawEther(
    application: Address,
    address: Address,
    amount: bigint
  ): Voucher {
    const balance = this.getOrCreateBalance(address);

    if (balance.getEther() >= amount) {
      balance.decreaseEther(amount);
      const voucher = this.encodeWithdrawCall(application, address, amount);

      console.log("Voucher created succesfully", voucher);

      return voucher;
    } else {
      throw Error("Insufficient balance");
    }
  }

  transferEther(from: Address, to: Address, amount: bigint): string {
    const fromBalance = this.getOrCreateBalance(from);
    const toBalance = this.getOrCreateBalance(to);

    if (fromBalance.getEther() >= amount) {
      fromBalance.decreaseEther(amount);
      toBalance.increaseEther(amount);
      console.log(
        `After transfer, balance for ${from} is ${fromBalance.getEther()}`
      );
      console.log(
        `After transfer, balance for ${to} is ${toBalance.getEther()}`
      );
      return JSON.stringify({
        type: "etherTransfer",
        from,
        to,
        amount: amount.toString(),
      });
    } else {
      throw Error("Insufficient amount");
    }
  }

  private parseDepositPayload(payload: string): [Address, bigint] {
    const addressData = ethers.dataSlice(payload, 0, 20);
    const amountData = ethers.dataSlice(payload, 20, 52);
    if (!addressData) {
      throw new Error("Invalid deposit payload");
    }
    return [getAddress(addressData), BigInt(amountData)];
  }

  private encodeWithdrawCall(
    application: Address,
    receiver: Address,
    amount: bigint
  ): Voucher {
    const call = "0x"

    return {
      destination: receiver,
      payload: call,
        value: `${amount.toString(16).padStart(64, '0')}` as `0x${string}`,
    };
  }
}
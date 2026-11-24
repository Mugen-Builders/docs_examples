import type { Address } from "viem";

export class Balance {
  constructor(
    private readonly address: Address,
    private ether: bigint = 0n,
  ) {}

  getEther(): bigint {
    return this.ether;
  }

  increaseEther(amount: bigint): void {
    if (amount < 0n) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    this.ether += amount;
  }

  decreaseEther(amount: bigint): void {
    if (amount < 0n) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    if (this.ether < amount) {
      throw new Error(`Insufficient balance for ${this.address}`);
    }
    this.ether -= amount;
  }
}

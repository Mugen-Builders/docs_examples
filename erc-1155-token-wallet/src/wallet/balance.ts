import type { Address } from "viem";

/** Per-account balances: ERC-1155 contract → tokenId → amount */
export class Balance {
  private holdings: Map<Address, Map<bigint, bigint>> = new Map();

  constructor(private readonly account: string) {}

  getAmount(erc1155: Address, tokenId: bigint): bigint {
    return this.holdings.get(erc1155)?.get(tokenId) ?? 0n;
  }

  increase(erc1155: Address, tokenId: bigint, amount: bigint): void {
    if (amount < 0n) {
      throw new Error(`Invalid amount for ${erc1155} id ${tokenId}`);
    }
    if (!this.holdings.has(erc1155)) {
      this.holdings.set(erc1155, new Map());
    }
    const byId = this.holdings.get(erc1155)!;
    byId.set(tokenId, (byId.get(tokenId) ?? 0n) + amount);
  }

  decrease(erc1155: Address, tokenId: bigint, amount: bigint): void {
    if (amount < 0n) {
      throw new Error(`Invalid amount for ${erc1155} id ${tokenId}`);
    }
    const current = this.getAmount(erc1155, tokenId);
    if (current < amount) {
      throw new Error(
        `Insufficient balance for ${erc1155} id ${tokenId} on ${this.account}`,
      );
    }
    this.holdings.get(erc1155)?.set(tokenId, current - amount);
  }

  listIds(erc1155: Address): { tokenId: string; amount: string }[] {
    const byId = this.holdings.get(erc1155);
    if (!byId) return [];
    return Array.from(byId.entries()).map(([id, amount]) => ({
      tokenId: id.toString(),
      amount: amount.toString(),
    }));
  }
}

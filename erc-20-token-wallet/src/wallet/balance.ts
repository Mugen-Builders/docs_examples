import { Address } from "viem";

export class Balance {
  private account: string;
  private erc20Balances: Map<Address, bigint>;

  constructor(account: string, erc20Balances: Map<Address, bigint>) {
    this.account = account;
    this.erc20Balances = erc20Balances;
  }

  listErc20(): Map<Address, bigint> {
    return this.erc20Balances;
  }

  getErc20Balance(erc20: Address): bigint | undefined {
    return this.erc20Balances.get(erc20);
  }

  increaseErc20Balance(erc20: Address, amount: bigint): void {
    if (amount < 0n) {
      throw new Error(
        `Failed to increase balance of ${erc20} for ${this.account}`
      );
    }
    try {
      if (this.erc20Balances.get(erc20) === undefined) {
        this.erc20Balances.set(erc20, 0n);
      }
      this.erc20Balances.set(
        erc20,
        (this.erc20Balances.get(erc20) || 0n) + amount
      );
      console.log("ERC20 balance is", this.erc20Balances);
    } catch (e) {
      throw new Error(
        `Failed to increase balance of ${erc20} for ${this.account}: ${e}`
      );
    }
  }

  decreaseErc20Balance(erc20: Address, amount: bigint): void {
    if (amount < 0n) {
      throw new Error(
        `Failed to decrease balance of ${erc20} for ${this.account}: invalid amount specified`
      );
    }
    if (this.erc20Balances.get(erc20) === undefined) {
      this.erc20Balances.set(erc20, 0n);
      throw new Error(
        `Failed to decrease balance of ${erc20} for ${this.account}: not found with ERC20 balance`
      );
    }
    let erc20Balance = this.erc20Balances.get(erc20) || 0n;
    if (erc20Balance < amount) {
      throw new Error(
        `Failed to decrease balance of ${erc20} for ${this.account}: insufficient ERC20 balance`
      );
    }
    this.erc20Balances.set(erc20, erc20Balance - amount);
  }
}
import { Address } from "viem";

export class Balance {
  private account: string;
  private erc721Tokens: Map<Address, Set<number>>;

  constructor(account: string, erc721Tokens: Map<Address, Set<number>>) {
    this.account = account;
    this.erc721Tokens = erc721Tokens;
  }

  listErc721(): Map<Address, Set<number>> {
    return this.erc721Tokens;
  }

  getErc721Tokens(erc721: Address): Set<number> | undefined {
    return this.erc721Tokens.get(erc721);
  }

  addErc721Token(erc721: Address, tokenId: number): void {
    if (!this.erc721Tokens.has(erc721)) {
      this.erc721Tokens.set(erc721, new Set());
    }
    const tokens = this.erc721Tokens.get(erc721);
    if (tokens) {
      tokens.add(tokenId);
    } else {
      throw new Error(
        `Failed to add token ${erc721}, id:${tokenId} for ${this.account}`
      );
    }
  }

  removeErc721Token(erc721: Address, tokenId: number): void {
    if (!this.erc721Tokens.has(erc721)) {
      throw new Error(
        `Failed to remove token ${erc721}, id:${tokenId} from ${this.account}: Collection not found`
      );
    }
    const tokens = this.erc721Tokens.get(erc721);
    if (!tokens?.delete(tokenId)) {
      throw new Error(
        `Failed to remove token ${erc721}, id:${tokenId} from ${this.account}: Token not found`
      );
    }
  }
}
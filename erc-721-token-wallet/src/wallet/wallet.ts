import { Address, getAddress, hexToBytes, encodeFunctionData } from "viem";
import { ethers } from "ethers";
import { Balance } from "./balance";

import { erc721Abi } from "viem";
import { Voucher } from "..";

export class Wallet {
  private accounts: Map<Address, Balance> = new Map();

  private getOrCreateBalance(address: Address): Balance {
    let balance = this.accounts.get(address);
    if (!balance) {
      balance = new Balance(address, new Map());
      this.accounts.set(address, balance);
    }
    return balance;
  }

  getBalance(address: Address): Balance {
    return this.getOrCreateBalance(address);
  }

  getErc721Balance(
    address: Address,
    erc721: Address
  ): { address: string; erc721: string; tokenIds: number[] } {
    const balance = this.getOrCreateBalance(address);
    const tokens = balance.getErc721Tokens(erc721) || new Set<number>();
    const tokenIdsArray = Array.from(tokens);

    const result = {
      address: address,
      erc721: erc721,
      tokenIds: tokenIdsArray,
    };

    console.info(
      `ERC721 balance for ${address} and contract ${erc721}: ${JSON.stringify(
        result,
        null,
        2
      )}`
    );
    return result;
  }

  processErc721Deposit(payload: string): string {
    try {
      const [erc721, account, tokenId] = this.parseErc721Deposit(payload);
      console.info(
        `Token ERC-721 ${erc721} id: ${tokenId} deposited in ${account}`
      );
      return this.depositErc721(account, erc721, tokenId);
    } catch (e) {
      return `Error depositing ERC721 token: ${e}`;
    }
  }

  private parseErc721Deposit(payload: string): [Address, Address, number] {
    const erc721 = getAddress(ethers.dataSlice(payload, 0, 20));
    const account = getAddress(ethers.dataSlice(payload, 20, 40));
    const tokenId = parseInt(ethers.dataSlice(payload, 40, 72));
    return [erc721, account, tokenId];
  }

  private depositErc721(
    account: Address,
    erc721: Address,
    tokenId: number
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
    rollupAddress: Address,
    account: Address,
    erc721: Address,
    tokenId: number
  ): Voucher {
    try {
      const balance = this.getOrCreateBalance(account);
      balance.removeErc721Token(erc721, tokenId);
      const call = encodeFunctionData({
        abi: erc721Abi,
        functionName: "safeTransferFrom",
        args: [rollupAddress, account, BigInt(tokenId)],
      });
      console.log("Voucher creator success", {
        destination: erc721,
        payload: call,
      });

      return {
        destination: erc721,
        payload: call,
        value: "0x0"
      };
    } catch (e) {
      throw Error(`Error withdrawing ERC721 token: ${e}`);
    }
  }

  transferErc721(
    from: Address,
    to: Address,
    erc721: Address,
    tokenId: number
  ): string {
    try {
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
        `Token ERC-721 ${erc721} id:${tokenId} transferred from ${from} to ${to}`
      );
      return JSON.stringify(noticePayload);
    } catch (e) {
      return `Error transferring ERC721 token: ${e}`;
    }
  }
}
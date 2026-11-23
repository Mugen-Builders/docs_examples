# ERC-721 token wallet

A Cartesi Rollups 2.0 backend application, in TypeScript, that tracks ERC-721 (NFT) ownership: it credits deposits made through the `Erc721Portal`, transfers NFTs between accounts inside the application, and withdraws them with vouchers that call `safeTransferFrom` from the application contract. Transfers and withdrawals always move tokens of the account that sends the input (`msgSender`).

This is the project you get by following the tutorial [Integrating ERC721 token wallet functionality](https://docs.cartesi.io/cartesi-rollups/2.0/tutorials/erc-721-token-wallet/). It was created with `cartesi create erc-721-token-wallet --template typescript`, then changed as the tutorial describes.

## Requirements

- [Cartesi CLI](https://docs.cartesi.io/cartesi-rollups/2.0/development/installation/) 2.0.0-alpha.42
- Docker
- Node.js 24+ (pnpm 11 through corepack)
- [Foundry](https://getfoundry.sh) (`cast`), to mint test tokens, approve the portal and execute the withdrawal voucher from the command line

## Build and run

```bash
cartesi build
cartesi run
```

`cartesi build` installs the dependencies inside the Docker build, so `pnpm install` is only needed to work on the code locally (`corepack enable pnpm` if the `pnpm` command is not available).

The `Erc721Portal` address in `src/index.ts` is the one printed by `cartesi address-book` for rollups-contracts v3.0.0-alpha.10.

## Try it

With `cartesi run` up, from this directory (devnet account 8, `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f`, is the user):

```bash
NFT=$(cartesi address-book TestNFT)
ERC721_PORTAL=$(cartesi address-book Erc721Portal)
KEY=0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97

# mint token ID 1, approve the portal and deposit it
cast send "$NFT" "mint(address,uint256)" 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f 1 \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cast send "$NFT" "setApprovalForAll(address,bool)" "$ERC721_PORTAL" true \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cartesi deposit erc721 1 --token "$NFT" \
  --project-name erc-721-token-wallet --rpc-url http://127.0.0.1:6751/anvil

# balance check (inspect): userAddress/erc721TokenAddress
curl -X POST http://127.0.0.1:6751/inspect/erc-721-token-wallet \
  -H "Content-Type: text/plain" \
  -d '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f/0x0761b8e3aB06F458632974393C48765E6Ddc61bB'

# withdraw (emits a voucher)
cartesi send --encoding string \
  '{"operation":"withdraw","erc721":"0x0761b8e3aB06F458632974393C48765E6Ddc61bB","tokenId":"1"}' \
  --project-name erc-721-token-wallet --rpc-url http://127.0.0.1:6751/anvil
```

Transfers inside the application use `{"operation":"transfer","erc721":"0xTokenAddress","to":"0xToAddress","tokenId":"1"}`.

A voucher can be executed once its epoch is closed and the claim is accepted on-chain, for example from the explorer (`cartesi run --services explorer`, then `http://localhost:6751/explorer`).

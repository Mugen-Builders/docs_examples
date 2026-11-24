# ERC-1155 token wallet

A Cartesi Rollups 2.0 backend application, in TypeScript, that tracks ERC-1155 balances: it credits single and batch deposits made through the `Erc1155SinglePortal` and `Erc1155BatchPortal`, transfers tokens between accounts inside the application, and withdraws them with vouchers that call `safeTransferFrom` or `safeBatchTransferFrom` from the application contract. Transfers and withdrawals always debit the account that sends the input (`msgSender`).

This is the project you get by following the tutorial [Integrating ERC1155 token wallet functionality](https://docs.cartesi.io/cartesi-rollups/2.0/tutorials/erc-1155-token-wallet/). It was created with `cartesi create erc-1155-token-wallet --template typescript`, then changed as the tutorial describes.

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

The portal addresses in `src/index.ts` are the ones printed by `cartesi address-book` for rollups-contracts v3.0.0-alpha.10.

## Try it

With `cartesi run` up, from this directory (devnet account 8, `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f`, is the user):

```bash
MULTI=$(cartesi address-book TestMultiToken)
SINGLE_PORTAL=$(cartesi address-book Erc1155SinglePortal)
BATCH_PORTAL=$(cartesi address-book Erc1155BatchPortal)
KEY=0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97

# single deposit: mint 100 of ID 1, approve the single portal, deposit 10 of ID 1
cast send "$MULTI" "mint(address,uint256,uint256)" 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f 1 100 \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cast send "$MULTI" "setApprovalForAll(address,bool)" "$SINGLE_PORTAL" true \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cartesi deposit erc1155-single 1 10 --token "$MULTI" \
  --project-name erc-1155-token-wallet --rpc-url http://127.0.0.1:6751/anvil

# batch deposit: mint 50 of ID 2, approve the batch portal, deposit 10 of ID 1 and 20 of ID 2
cast send "$MULTI" "mint(address,uint256,uint256)" 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f 2 50 \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cast send "$MULTI" "setApprovalForAll(address,bool)" "$BATCH_PORTAL" true \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cartesi deposit erc1155-batch 1,2 10,20 --token "$MULTI" \
  --project-name erc-1155-token-wallet --rpc-url http://127.0.0.1:6751/anvil

# balance check (inspect): erc1155/userAddress/contractAddress[/tokenId]
curl -X POST http://127.0.0.1:6751/inspect/erc-1155-token-wallet \
  -H "Content-Type: text/plain" \
  -d 'erc1155/0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f/0xAaE893D28b7645B5E09bc16688dddd451aC89C19/1'

# single transfer inside the application
cartesi send --encoding string \
  '{"operation":"transfer","mode":"single","erc1155":"0xAaE893D28b7645B5E09bc16688dddd451aC89C19","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","tokenId":"1","amount":"5"}' \
  --project-name erc-1155-token-wallet --rpc-url http://127.0.0.1:6751/anvil

# batch withdraw (emits a voucher)
cartesi send --encoding string \
  '{"operation":"withdraw","mode":"batch","erc1155":"0xAaE893D28b7645B5E09bc16688dddd451aC89C19","tokenIds":["1","2"],"amounts":["5","10"]}' \
  --project-name erc-1155-token-wallet --rpc-url http://127.0.0.1:6751/anvil
```

A voucher can be executed once its epoch is closed and the claim is accepted on-chain, for example from the explorer (`cartesi run --services explorer`, then `http://localhost:6751/explorer`).

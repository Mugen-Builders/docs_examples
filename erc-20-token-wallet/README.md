# ERC-20 token wallet

A Cartesi Rollups 2.0 backend application, in TypeScript, that tracks ERC-20 balances: it credits deposits made through the `Erc20Portal`, transfers tokens between accounts inside the application, and withdraws them with vouchers that call `transfer` on the token contract. Transfers and withdrawals always debit the account that sends the input (`msgSender`).

This is the project you get by following the tutorial [Integrating ERC20 token wallet functionality](https://docs.cartesi.io/cartesi-rollups/2.0/tutorials/erc-20-token-wallet/). It was created with `cartesi create erc-20-token-wallet --template typescript`, then changed as the tutorial describes.

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

The `Erc20Portal` address in `src/index.ts` is the one printed by `cartesi address-book` for rollups-contracts v3.0.0-alpha.10.

## Try it

With `cartesi run` up, from this directory (devnet account 8, `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f`, is the user):

```bash
TOKEN=$(cartesi address-book TestToken)
ERC20_PORTAL=$(cartesi address-book Erc20Portal)
KEY=0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97

# mint test tokens, approve the portal and deposit 1 token
cast send "$TOKEN" "mint(uint256)" 1000000000000000000 \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cast send "$TOKEN" "approve(address,uint256)" "$ERC20_PORTAL" 1000000000000000000 \
  --rpc-url http://127.0.0.1:6751/anvil --private-key $KEY
cartesi deposit erc20 1 --token "$TOKEN" \
  --project-name erc-20-token-wallet --rpc-url http://127.0.0.1:6751/anvil

# balance check (inspect): userAddress/erc20TokenAddress
curl -X POST http://127.0.0.1:6751/inspect/erc-20-token-wallet \
  -H "Content-Type: text/plain" \
  -d '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f/0x86EA17052C8e335Ad830B54EF566274EAB46B852'

# withdraw (emits a voucher)
cartesi send --encoding string \
  '{"operation":"withdraw","erc20":"0x86EA17052C8e335Ad830B54EF566274EAB46B852","amount":"1000000000000000000"}' \
  --project-name erc-20-token-wallet --rpc-url http://127.0.0.1:6751/anvil
```

Transfers inside the application use `{"operation":"transfer","erc20":"0xTokenAddress","to":"0xToAddress","amount":"1000000000000000000"}`.

A voucher can be executed once its epoch is closed and the claim is accepted on-chain, for example from the explorer (`cartesi run --services explorer`, then `http://localhost:6751/explorer`).

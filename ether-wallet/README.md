# Ether wallet

A Cartesi Rollups 2.0 backend application, in TypeScript, that tracks Ether balances: it credits deposits made through the `EtherPortal`, transfers Ether between accounts inside the application, and withdraws it with vouchers. Transfers and withdrawals always debit the account that sends the input (`msgSender`).

This is the project you get by following the tutorial [Integrating Ether wallet functionality](https://docs.cartesi.io/cartesi-rollups/2.0/tutorials/ether-wallet/). It was created with `cartesi create ether-wallet --template typescript`, then changed as the tutorial describes.

## Requirements

- [Cartesi CLI](https://docs.cartesi.io/cartesi-rollups/2.0/development/installation/) 2.0.0-alpha.42
- Docker
- Node.js 24+ (pnpm 11 through corepack)
- [Foundry](https://getfoundry.sh) (`cast`), only to execute the withdrawal voucher from the command line

## Build and run

```bash
cartesi build
cartesi run
```

`cartesi build` installs the dependencies inside the Docker build, so `pnpm install` is only needed to work on the code locally (`corepack enable pnpm` if the `pnpm` command is not available).

The `EtherPortal` address in `src/index.ts` is the one printed by `cartesi address-book` for rollups-contracts v3.0.0-alpha.10.

## Try it

With `cartesi run` up, from this directory:

```bash
# deposit 2 ETH from devnet account 8 (0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f),
# enough for the 1 ETH transfer and the 1 ETH withdrawal below
cartesi deposit ether 2 \
  --project-name ether-wallet \
  --rpc-url http://127.0.0.1:6751/anvil

# balance check (inspect)
curl -X POST http://127.0.0.1:6751/inspect/ether-wallet \
  -H "Content-Type: text/plain" \
  -d '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'

# transfer inside the application
cartesi send --encoding string \
  '{"operation":"transfer","to":"0x3f2bd12ea0b8604c2af5bf241f6a606e892a403a","amount":"1000000000000000000"}' \
  --project-name ether-wallet \
  --rpc-url http://127.0.0.1:6751/anvil

# withdraw (emits a voucher)
cartesi send --encoding string \
  '{"operation":"withdraw","amount":"1000000000000000000"}' \
  --project-name ether-wallet \
  --rpc-url http://127.0.0.1:6751/anvil
```

A voucher can be executed once its epoch is closed and the claim is accepted on-chain, for example from the explorer (`cartesi run --services explorer`, then `http://localhost:6751/explorer`).

import "dotenv/config"
import { defineChain } from 'viem';
import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { mainnet, sepolia, cannon } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// Ensure dotenv is loaded before accessing env variables
let APPRPC = "http://127.0.0.1:6751/anvil";


export const cartesi = defineChain({
  ...cannon,
  rpcUrls: { default: { http: [APPRPC] } },
});

export function getConfig() {
  
let projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID as string;


  return createConfig({
    chains: [cartesi],
    connectors: [
      injected(),
      coinbaseWallet(),
      walletConnect({ projectId }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [cartesi.id]: http(APPRPC),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}

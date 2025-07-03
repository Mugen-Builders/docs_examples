import "dotenv/config"
import {
  createKernelAccount,
  createKernelAccountClient,
} from "@zerodev/sdk"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { KERNEL_V3_2 } from "@zerodev/sdk/constants"
import {
  entryPoint07Address,
  EntryPointVersion,
} from "viem/account-abstraction"
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createPaymasterClient } from "viem/account-abstraction";
import { Address, createPublicClient, http } from "viem"
import {cartesi} from "./wagmi"

let BUNDLER_URL = "http://127.0.0.1:6751/bundler/rpc";
let PAYMASTER_URL = "http://127.0.0.1:6751/paymaster/";
let APPRPC = "http://127.0.0.1:6751/anvil";
let chain = cartesi;


export const useSmartAccountClient = async (walletClient: any) => { 

    const originalKernelVersion = KERNEL_V3_2

    const publicClient = createPublicClient({
        chain,
        transport: http(APPRPC),
    })
    
    const entryPoint = {
        address: entryPoint07Address as Address,
        version: "0.7" as EntryPointVersion,
    }

    const signer = walletClient;

    if (!signer) {
        throw new Error("Wallet client (signer) is undefined");
    }

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer,
        entryPoint,
        kernelVersion: originalKernelVersion,
    })

    const account = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator,
        },
        entryPoint,
        kernelVersion: originalKernelVersion,
    })
    

    const estimateFeesPerGas: any = async () => {
        const pimlicoClient = createPimlicoClient({
            transport: http(BUNDLER_URL),
        });
        const gas = await pimlicoClient.getUserOperationGasPrice();
        return gas.standard;
    };
  
  
    const paymasterClient = createPaymasterClient({
      transport: http(PAYMASTER_URL),
    })
    

  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(BUNDLER_URL),
    userOperation: { estimateFeesPerGas },
    client: publicClient,
    paymaster: paymasterClient,
  })
    

    return kernelClient;
}


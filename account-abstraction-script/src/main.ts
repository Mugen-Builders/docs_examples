import "dotenv/config"
import {
  createKernelAccount,
  createKernelAccountClient,
} from "@zerodev/sdk"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { http, Hex, createPublicClient, zeroAddress, Address, defineChain, parseAbi, encodeFunctionData } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { KERNEL_V3_2 } from "@zerodev/sdk/constants"
import {
  entryPoint07Address,
  EntryPointVersion,
} from "viem/account-abstraction"
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createPaymasterClient } from "viem/account-abstraction";



const BUNDLER_RPC = `http://127.0.0.1:6751/bundler/rpc`
const PAYMASTER_RPC = `http://127.0.0.1:6751/paymaster/`
const APPRPC = `http://127.0.0.1:6751/anvil`
const appAddress = "0xa083af219355288722234c47d4c8469ca9af6605";
const inpuBoxAddress = "0xc70074BDD26d8cF983Ca6A5b89b8db52D5850051";

const contractABI = parseAbi([
  "function mint(address _to) public",
  "function balanceOf(address owner) external view returns (uint256 balance)",
]);

const inputBoxABI = parseAbi([
  "function addInput(address appContract, bytes calldata payload) external returns (bytes32)",
]);

export const cannon = /*#__PURE__*/ defineChain({
  id: 13_370,
  name: 'Cannon',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:6751/anvil'] },
  },
})


const cartesi = defineChain({
  ...cannon,
  rpcUrls: { default: { http: [APPRPC] } },
});

const chain = cartesi;

const publicClient = createPublicClient({
  chain,
  transport: http(APPRPC),
})

const signer = privateKeyToAccount(generatePrivateKey() as Hex)
const entryPoint = {
  address: entryPoint07Address as Address,
  version: "0.7" as EntryPointVersion,
}

const main = async () => {
  const originalKernelVersion = KERNEL_V3_2
  console.log("Started");


  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion: originalKernelVersion,
  })
  console.log("validator created:", ecdsaValidator.address);


  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion: originalKernelVersion,
  })
  console.log("My account:", account.address)


  const estimateFeesPerGas = async () => {
      const pimlicoClient = createPimlicoClient({
          transport: http(BUNDLER_RPC),
      });
      const gas = await pimlicoClient.getUserOperationGasPrice();
      return gas.standard;
  };


  const paymasterClient = createPaymasterClient({
    transport: http(PAYMASTER_RPC),
})
  
  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(BUNDLER_RPC),
    userOperation: { estimateFeesPerGas },
    client: publicClient,
    paymaster: paymasterClient,
  })


  console.log("client created, address::", kernelClient.account.accountImplementationAddress);


  const userOpHash = await kernelClient.sendUserOperation({
    callData: await kernelClient.account.encodeCalls([{
      to: inpuBoxAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: inputBoxABI,
        functionName: "addInput",
        args: [appAddress, "0x67656e65726963"],
      }),
    }]),
  })
  console.log("UserOp hash:", userOpHash)

  const _receipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  })
  console.log('bundle txn hash: ', _receipt.receipt.transactionHash)

  console.log("userOp completed")

  process.exit(0);
}

main()

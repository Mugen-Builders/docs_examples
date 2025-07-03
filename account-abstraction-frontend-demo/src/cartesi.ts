import { Address, encodeFunctionData, Hash, Hex, parseAbi } from "viem";
import { useSmartAccountClient } from "./zerodev";



export const useInputBoxAddInput = async (args: Hex, walletClient: any) => {
    let INPUTBOXADDRESS = '0xc70074BDD26d8cF983Ca6A5b89b8db52D5850051' as Address;
    let APPADDRESS = '0xa083af219355288722234c47d4c8469ca9af6605' as Address;

    const smartAccountClient = await useSmartAccountClient(walletClient);
    console.log("printing useSmartAccountClient");
    console.log(smartAccountClient);
    const inputBoxABI = parseAbi([
        "function addInput(address appContract, bytes calldata payload) external returns (bytes32)",
    ]);

    const userOpHash = await smartAccountClient.sendUserOperation({
        callData: await smartAccountClient.account.encodeCalls([{
            to: INPUTBOXADDRESS,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: inputBoxABI,
              functionName: "addInput",
              args: [APPADDRESS, args],
            }),
          }]),
    });
    const _receipt = await smartAccountClient.waitForUserOperationReceipt({
        hash: userOpHash,
    })
    let _hash = _receipt.receipt.transactionHash as Hash;

    return _hash;

};


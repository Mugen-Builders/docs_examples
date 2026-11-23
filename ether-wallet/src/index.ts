import {
  type AdvanceRequest,
  type InspectRequest,
  Rollup,
} from "@cartesi/rollup";
import {
  type Address,
  bytesToHex,
  getAddress,
  isAddressEqual,
  stringToHex,
} from "viem";
import { Wallet } from "./wallet/wallet";

// Replace with the EtherPortal address from `cartesi address-book`
const ETHER_PORTAL: Address = "0x035b11Be55656c6cfC822D1CaE568C1Af2e497b0";

const rollup = new Rollup();
const wallet = new Wallet();

const handleAdvance = (request: AdvanceRequest): boolean => {
  console.log(
    `Received advance request from ${request.msgSender} with index ${request.index}`,
  );

  if (isAddressEqual(request.msgSender, ETHER_PORTAL)) {
    // Deposit: the portal names the depositor in the payload
    const deposit = wallet.depositEther(bytesToHex(request.payload));
    rollup.emitNotice(stringToHex(deposit));
    return true;
  }

  // Transfer or withdrawal: always on behalf of the account that sent the input
  const owner = getAddress(request.msgSender);
  try {
    const { operation, to, amount } = JSON.parse(
      request.payload.toString("utf8"),
    );

    if (operation === "transfer") {
      const transfer = wallet.transferEther(owner, getAddress(to), BigInt(amount));
      rollup.emitNotice(stringToHex(transfer));
    } else if (operation === "withdraw") {
      // The application contract (request.appContract) holds the deposited
      // Ether and sends it to the owner when the voucher is executed
      const voucher = wallet.withdrawEther(owner, BigInt(amount));
      rollup.emitVoucher(voucher);
    } else {
      throw new Error(`Unknown operation: ${operation}`);
    }
    return true;
  } catch (error) {
    console.error("Error processing payload:", error);
    rollup.emitReport(stringToHex(`Error processing payload: ${error}`));
    return false;
  }
};

const handleInspect = (request: InspectRequest): void => {
  try {
    const address = getAddress(request.payload.toString("utf8"));
    const balance = wallet.getBalance(address);
    rollup.emitReport(stringToHex(`Balance for ${address} is ${balance} wei`));
  } catch (error) {
    rollup.emitReport(
      stringToHex(`Error processing inspect payload: ${error}`),
    );
  }
};

await rollup.run({ advance: handleAdvance, inspect: handleInspect });

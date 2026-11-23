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

// Replace with the Erc20Portal address from `cartesi address-book`
const ERC20_PORTAL: Address = "0x3332DE61a8BB9aC84893b2f552Fe81C9a6dC5419";

const rollup = new Rollup();
const wallet = new Wallet();

const handleAdvance = (request: AdvanceRequest): boolean => {
  console.log(
    `Received advance request from ${request.msgSender} with index ${request.index}`,
  );

  if (isAddressEqual(request.msgSender, ERC20_PORTAL)) {
    // Deposit: the portal names the token and the depositor in the payload
    const deposit = wallet.processErc20Deposit(bytesToHex(request.payload));
    rollup.emitNotice(stringToHex(deposit));
    return true;
  }

  // Transfer or withdrawal: always on behalf of the account that sent the input
  const owner = getAddress(request.msgSender);
  try {
    const { operation, erc20, to, amount } = JSON.parse(
      request.payload.toString("utf8"),
    );

    if (operation === "transfer") {
      const transfer = wallet.transferErc20(
        owner,
        getAddress(to),
        getAddress(erc20),
        BigInt(amount),
      );
      rollup.emitNotice(stringToHex(transfer));
    } else if (operation === "withdraw") {
      const voucher = wallet.withdrawErc20(
        owner,
        getAddress(erc20),
        BigInt(amount),
      );
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
    const [address, erc20] = request.payload.toString("utf8").split("/");
    if (address === undefined || erc20 === undefined) {
      throw new Error("expected userAddress/erc20TokenAddress");
    }
    const balance = wallet.getAccountBalance(
      getAddress(address),
      getAddress(erc20),
    );
    rollup.emitReport(
      stringToHex(
        `Balance of token ${erc20} for user address ${address} is ${balance}`,
      ),
    );
  } catch (error) {
    rollup.emitReport(
      stringToHex(`Error processing inspect payload: ${error}`),
    );
  }
};

await rollup.run({ advance: handleAdvance, inspect: handleInspect });

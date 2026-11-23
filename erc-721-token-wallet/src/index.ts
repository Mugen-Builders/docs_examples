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

// Replace with the Erc721Portal address from `cartesi address-book`
const ERC721_PORTAL: Address = "0x397c352d18DFf47CC8a6143403142cf7afd5Ff7E";

const rollup = new Rollup();
const wallet = new Wallet();

const handleAdvance = (request: AdvanceRequest): boolean => {
  console.log(
    `Received advance request from ${request.msgSender} with index ${request.index}`,
  );

  if (isAddressEqual(request.msgSender, ERC721_PORTAL)) {
    // Deposit: the portal names the collection, the depositor and the token ID
    const deposit = wallet.processErc721Deposit(bytesToHex(request.payload));
    rollup.emitNotice(stringToHex(deposit));
    return true;
  }

  // Transfer or withdrawal: always on behalf of the account that sent the input
  const owner = getAddress(request.msgSender);
  try {
    const { operation, erc721, to, tokenId } = JSON.parse(
      request.payload.toString("utf8"),
    );

    if (operation === "transfer") {
      const transfer = wallet.transferErc721(
        owner,
        getAddress(to),
        getAddress(erc721),
        BigInt(tokenId),
      );
      rollup.emitNotice(stringToHex(transfer));
    } else if (operation === "withdraw") {
      // The application contract holds the deposited NFTs, so it is the
      // `from` address of the `safeTransferFrom` call in the voucher
      const voucher = wallet.withdrawErc721(
        request.appContract,
        owner,
        getAddress(erc721),
        BigInt(tokenId),
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
    const [address, erc721] = request.payload.toString("utf8").split("/");
    if (address === undefined || erc721 === undefined) {
      throw new Error("expected userAddress/erc721TokenAddress");
    }
    const balance = wallet.getErc721Balance(
      getAddress(address),
      getAddress(erc721),
    );
    rollup.emitReport(stringToHex(JSON.stringify(balance)));
  } catch (error) {
    rollup.emitReport(
      stringToHex(`Error processing inspect payload: ${error}`),
    );
  }
};

await rollup.run({ advance: handleAdvance, inspect: handleInspect });

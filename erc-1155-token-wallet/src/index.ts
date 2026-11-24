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

// Replace with the addresses from `cartesi address-book`
const ERC1155_SINGLE_PORTAL: Address = "0x585F56351A66f131E176a345662215C772f80451";
const ERC1155_BATCH_PORTAL: Address = "0xee33550a22e3Cf6Cc265524dC9bcfD99D2307EBe";

const rollup = new Rollup();
const wallet = new Wallet();

const parseBigIntArray = (values: string[] | string): bigint[] => {
  const list = Array.isArray(values) ? values : [values];
  return list.map((v) => BigInt(v));
};

const handleAdvance = (request: AdvanceRequest): boolean => {
  console.log(
    `Received advance request from ${request.msgSender} with index ${request.index}`,
  );

  if (isAddressEqual(request.msgSender, ERC1155_SINGLE_PORTAL)) {
    const deposit = wallet.processSingleDeposit(bytesToHex(request.payload));
    rollup.emitNotice(stringToHex(deposit));
    return true;
  }

  if (isAddressEqual(request.msgSender, ERC1155_BATCH_PORTAL)) {
    const deposit = wallet.processBatchDeposit(bytesToHex(request.payload));
    rollup.emitNotice(stringToHex(deposit));
    return true;
  }

  // Transfer or withdrawal: always on behalf of the account that sent the input
  const owner = getAddress(request.msgSender);
  try {
    const body = JSON.parse(request.payload.toString("utf8"));
    const { operation, mode } = body;
    const erc1155 = getAddress(body.erc1155);

    if (operation === "transfer" && mode === "single") {
      const notice = wallet.transferSingle(
        owner,
        getAddress(body.to),
        erc1155,
        BigInt(body.tokenId),
        BigInt(body.amount),
      );
      rollup.emitNotice(stringToHex(notice));
    } else if (operation === "transfer" && mode === "batch") {
      const notice = wallet.transferBatch(
        owner,
        getAddress(body.to),
        erc1155,
        parseBigIntArray(body.tokenIds),
        parseBigIntArray(body.amounts),
      );
      rollup.emitNotice(stringToHex(notice));
    } else if (operation === "withdraw" && mode === "single") {
      // The application contract holds the deposited tokens, so it is the
      // `from` address of the transfer call in the voucher
      const voucher = wallet.withdrawSingle(
        request.appContract,
        owner,
        erc1155,
        BigInt(body.tokenId),
        BigInt(body.amount),
      );
      rollup.emitVoucher(voucher);
    } else if (operation === "withdraw" && mode === "batch") {
      const voucher = wallet.withdrawBatch(
        request.appContract,
        owner,
        erc1155,
        parseBigIntArray(body.tokenIds),
        parseBigIntArray(body.amounts),
      );
      rollup.emitVoucher(voucher);
    } else {
      throw new Error(`Unknown operation ${operation} with mode ${mode}`);
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
    const query = request.payload.toString("utf8");
    const [kind, address, erc1155, tokenId] = query.split("/");
    if (kind !== "erc1155" || address === undefined || erc1155 === undefined) {
      throw new Error("expected erc1155/userAddress/contractAddress[/tokenId]");
    }
    if (tokenId !== undefined) {
      const amount = wallet.getBalance(
        getAddress(address),
        getAddress(erc1155),
        BigInt(tokenId),
      );
      rollup.emitReport(
        stringToHex(
          `Balance of ${erc1155} id ${tokenId} for ${address} is ${amount}`,
        ),
      );
    } else {
      const summary = wallet.listBalances(
        getAddress(address),
        getAddress(erc1155),
      );
      rollup.emitReport(stringToHex(JSON.stringify(summary)));
    }
  } catch (error) {
    rollup.emitReport(
      stringToHex(`Error processing inspect payload: ${error}`),
    );
  }
};

await rollup.run({ advance: handleAdvance, inspect: handleInspect });

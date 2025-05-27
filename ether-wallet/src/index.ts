import createClient from "openapi-fetch";
import type { components, paths } from "./schema";
import { Wallet } from "./wallet/wallet";
import { stringToHex, getAddress, Address, hexToString } from "viem";

type AdvanceRequestData = components["schemas"]["Advance"];
type InspectRequestData = components["schemas"]["Inspect"];
type RequestHandlerResult = components["schemas"]["Finish"]["status"];
type RollupRequest = components["schemas"]["RollupRequest"];
type InspectRequestHandler = (data: InspectRequestData) => Promise<void>;
type AdvanceRequestHandler = (
  data: AdvanceRequestData
) => Promise<RequestHandlerResult>;

export type Notice = components["schemas"]["Notice"];
export type Payload = components["schemas"]["Payload"];
export type Report = components["schemas"]["Report"];
export type Voucher = components["schemas"]["Voucher"];

const wallet = new Wallet();
const EtherPortal = `0xd31aD6613bDaA139E7D12B2428C0Dd00fdBF8aDa`;

const rollupServer = process.env.ROLLUP_HTTP_SERVER_URL;
console.log(`HTTP rollup_server url is ${rollupServer}`);

const handleAdvance: AdvanceRequestHandler = async (data) => {
  console.log(`Received advance request data ${JSON.stringify(data)}`);

    const dAppAddress = data["metadata"]["app_contract"];
  const sender = data["metadata"]["msg_sender"];
  const payload = data.payload;

  if (sender.toLowerCase() === EtherPortal.toLowerCase()) {
    // Handle deposit
    const deposit = wallet.depositEther(payload);
    await createNotice({ payload: stringToHex(deposit) });
  } else {
    // Handle transfer or withdrawal
    try {
      const { operation, from, to, amount } = JSON.parse(hexToString(payload));

      if (operation === "transfer") {
        const transfer = wallet.transferEther(
          getAddress(from as Address),
          getAddress(to as Address),
          BigInt(amount)
        );
        await createNotice({ payload: stringToHex(transfer) });
      } else if (operation === "withdraw") {
        const voucher = wallet.withdrawEther(
          getAddress(dAppAddress as Address),
          getAddress(from as Address),
          BigInt(amount)
        );

        await createVoucher(voucher);
      } else {
        console.log("Unknown operation");
      }
    } catch (error) {
      console.error("Error processing payload:", error);
    }
  }

  return "accept";
};

const handleInspect: InspectRequestHandler = async (data) => {
  console.log(`Received inspect request data ${JSON.stringify(data)}`);

    try {
    const address = hexToString(data.payload);
    console.log(address);
    const balance = wallet.getBalance(address as Address);

    const reportPayload = `Balance for ${address} is ${balance} wei}`;
    await createReport({ payload: stringToHex(reportPayload) });
  } catch (error) {
    console.error("Error processing inspect payload:", error);
  }
};

const createNotice = async (payload: Notice) => {
  console.log("creating notice with payload", payload);

  await fetch(`${rollupServer}/notice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

const createVoucher = async (payload: Voucher) => {
  await fetch(`${rollupServer}/voucher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

const createReport = async (payload: Report) => {
  await fetch(`${rollupServer}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

const main = async () => {
  const { POST } = createClient<paths>({ baseUrl: rollupServer });
  let status: RequestHandlerResult = "accept";
  while (true) {
    const { data, response } = await POST("/finish", {
      body: { status },
      parseAs: "text",
    });

    if (response.status === 200 && data) {
      const request = JSON.parse(data) as RollupRequest;
      switch (request.request_type) {
        case "advance_state":
          status = await handleAdvance(request.data as AdvanceRequestData);
          break;
        case "inspect_state":
          await handleInspect(request.data as InspectRequestData);
          break;
      }
    } else if (response.status === 202) {
      // no rollup request available
      console.log(await response.text());
    }
  }
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});

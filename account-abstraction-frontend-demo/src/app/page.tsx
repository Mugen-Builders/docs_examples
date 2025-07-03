"use client";
import { useEffect, useState } from "react";
import { isHex, stringToHex } from "viem";
import {
  useAccount,
  useBlockNumber,
  useConnect,
  useDisconnect,
  useWalletClient,
} from "wagmi";
import { useInputBoxAddInput } from "@/cartesi";
import { useSmartAccountClient } from "../zerodev";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const [usePaymaster, setUsePaymaster] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [payload, setPayload] = useState<string>("hello");

  const { data: walletClient } = useWalletClient();

  const sunmitUserOp = async () => {
    setIsSubmitting(true);
    let hexPayload = isHex(payload) ? payload : stringToHex(payload);
    await useInputBoxAddInput(hexPayload, walletClient);
    window.alert(
      "Transaction submitted to application. Check your node logs for more details"
    );
    setIsSubmitting(false);
  };

  const [smartAccountClient, setSmartAccountClient] = useState<any>(null);

  useEffect(() => {
    const fetchSmartAccountClient = async () => {
      const client = await useSmartAccountClient(walletClient);
      setSmartAccountClient(client);
    };
    fetchSmartAccountClient();
  }, [walletClient]);

  return (
    <>
      <div>
        <h2>Account (Signer)</h2>

        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
          <br />
          blockNumber: {blockNumber?.toString()}
        </div>

        {account.status === "connected" && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>

      <div>
        <h2>Account Abstraction</h2>
        <div>
          Smart Account Address:
          <text>{smartAccountClient?.account.address}</text>
        </div>
      </div>

      <div>
        <h2>Transaction</h2>
        <div>
          payload:
          <input value={payload} onChange={(e) => setPayload(e.target.value)} />
        </div>
        <input
          type="checkbox"
          id="usePaymaster"
          checked={usePaymaster}
          onChange={() => setUsePaymaster(!usePaymaster)}
        />
        <label htmlFor="usePaymaster">Use Paymaster</label>
        <br />
        <button onClick={sunmitUserOp} disabled={isSubmitting}>
          Send Input
        </button>
      </div>
    </>
  );
}

export default App;

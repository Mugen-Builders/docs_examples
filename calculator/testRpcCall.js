// If using Node.js < 18, install node-fetch: npm install node-fetch
// For Node.js < 18, uncomment the line below:
// import fetch from 'node-fetch';

(async () => {
    const response = await fetch("http://localhost:8080/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "cartesi_listOutputs",
            params: {
                application: "0xd6c34b2d1f7509a1a6b415c6a145e0cca076881d"
            },
            id: 0
        }),
    });

    const result = await response.json();
    console.log("RPC Result:", result);

    if (result.result && result.result.outputs) {
        for (let output of result.result.outputs) {
            console.log("Output Payload:", output.payload);
        }
    }
})();

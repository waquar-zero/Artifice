import runTcpTests from "./runners/tcpTestRunner.js";

const code = `
const net = require("net");
const server = net.createServer((socket) => {
  socket.on("data", (chunk) => {
    const input = chunk.toString();
    if (input.startsWith("PING")) socket.write("PONG\\r\\n");
    else if (input.startsWith("GET ")) socket.write(input.split("\\r\\n")[0]);
  });
});
server.listen(3000, "127.0.0.1");
`;

const result = await runTcpTests({
    code,
    execution: { entrypoint: "server.js", startCommand: "node server.js", port: 3000 },
    testSpec: {
        type: "tcp",
        checks: [
            { type: "server_starts" },
            { type: "tcp_connection" },
            { type: "receives_data" },
            { type: "sends_response" },
            { type: "http_request" },
            { type: "method_detection" },
            { type: "path_detection" },
            { type: "http_version_detection" },
            { type: "multiple_connections" },
            { type: "multiple_requests" },
            { type: "malformed_request" },
            { type: "server_stays_alive" }
        ]
    }
});

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

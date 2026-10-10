
import runHttpTests from "./runners/httpTestRunner.js";

const code = `
const net = require("net");

const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        const request = data.toString();
        const path = request.split(" ")[1];

        let body = "Hello";

        if (path === "/about") {
            body = "About";
        } else if (path !== "/") {
            body = "Not Found";
        }

        const status = path === "/does-not-exist"
            ? "404 Not Found"
            : "200 OK";

        socket.write(
            "HTTP/1.1 " + status + "\\r\\n" +
            "Content-Length: " + Buffer.byteLength(body) + "\\r\\n" +
            "Connection: close\\r\\n" +
            "\\r\\n" +
            body
        );

        socket.end();
    });
});

server.listen(3000);
`;

const testSpec = {
    type: "http",
    checks: [
        { type: "server_starts" },
        { type: "http_request" },
    {
    type: "route",
    config: {
        method: "GET",
        path: "/",
        expectedStatus: 200,
        expectedBody: "Hello"
    }
    },
    {
    type: "route",
    config: {
        method: "GET",
        path: "/about",
        expectedStatus: 200,
        expectedBody: "About"
    }
    },
        { type: "unknown_route" }
    ]
};

const execution = {
    type: "process",
    entrypoint: "server.js",
    startCommand: "node server.js",
    port: 3000
};

const result = await runHttpTests({
    testSpec,
    code,
    execution
});

console.log(JSON.stringify(result, null, 2));

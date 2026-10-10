import net from "node:net";
import { startProcess, stopProcess } from "../../execution/processRunner.js";

const connect = (port, { payload, timeoutMs = 700 } = {}) => new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    let data = "";
    let settled = false;
    const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        error ? reject(error) : resolve(data);
    };
    const timer = setTimeout(() => finish(), timeoutMs);
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
        if (payload) socket.write(payload);
        else finish();
    });
    socket.on("data", (chunk) => { data += chunk.toString("utf8"); });
    socket.once("error", finish);
    socket.once("timeout", () => finish());
    socket.once("close", () => finish());
});

const countSequentialResponses = (port, expected, count) => new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    let data = "";
    let settled = false;
    const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        error ? reject(error) : resolve(data);
    };
    const timer = setTimeout(() => finish(), 2000);
    socket.once("connect", () => socket.write("PING\r\n"));
    socket.on("data", (chunk) => {
        data += chunk.toString("utf8");
        const received = data.split(expected).length - 1;
        if (received >= count) finish();
        else if (received > 0) socket.write("PING\r\n");
    });
    socket.once("error", finish);
    socket.once("timeout", () => finish());
    socket.once("close", () => finish());
});

const checkOnce = async ({ check, port }) => {
    const config = check.config ?? {};
    const request = "GET /probe HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n";
    let actual;
    let expected;
    let passed = false;

    switch (check.type) {
        case "server_starts":
            passed = true;
            break;
        case "tcp_connection":
            await connect(port);
            passed = true;
            actual = "connection accepted";
            break;
        case "receives_data":
        case "sends_response":
        case "tcp_echo":
            actual = await connect(port, { payload: config.payload ?? "PING\r\n" });
            expected = config.expectedText ?? "PONG";
            passed = actual.includes(expected);
            break;
        case "http_request":
            actual = await connect(port, { payload: request });
            passed = actual.length > 0;
            break;
        case "method_detection":
            actual = await connect(port, { payload: request });
            expected = config.expectedText ?? "GET";
            passed = actual.includes(expected);
            break;
        case "path_detection":
            actual = await connect(port, { payload: request });
            expected = config.expectedText ?? "/probe";
            passed = actual.includes(expected);
            break;
        case "http_version_detection":
            actual = await connect(port, { payload: request });
            expected = config.expectedText ?? "HTTP/1.1";
            passed = actual.includes(expected);
            break;
        case "multiple_connections":
            await connect(port);
            await connect(port);
            actual = "two connections accepted";
            passed = true;
            break;
        case "multiple_requests":
            expected = config.expectedText ?? "PONG";
            actual = await countSequentialResponses(port, expected, 2);
            passed = actual.split(expected).length - 1 >= 2;
            break;
        case "malformed_request":
            await connect(port, { payload: "\u0000\u0001\u0002\r\n" });
            actual = "malformed input sent";
            passed = true;
            break;
        case "server_stays_alive":
            actual = await connect(port, { payload: "PING\r\n" });
            passed = actual.includes(config.expectedText ?? "PONG");
            break;
        default:
            return { passed: false, check: check.type, error: `Unsupported TCP check: ${check.type}` };
    }

    return { passed, check: check.type, ...(actual === undefined ? {} : { actual }), ...(expected === undefined ? {} : { expected }) };
};

export default async function runTcpTests({ testSpec, code, execution }) {
    if (!Array.isArray(testSpec.checks) || testSpec.checks.length === 0) {
        throw new Error("TCP test specification must include checks");
    }
    let processResult;
    try {
        processResult = await startProcess({ code, execution });
        const results = [];
        for (const check of testSpec.checks) {
            try {
                results.push(await checkOnce({ check, port: processResult.port }));
            } catch (error) {
                results.push({ passed: false, check: check.type, error: error.message });
            }
        }
        return {
            passed: results.every((result) => result.passed),
            totalTests: results.length,
            passedTests: results.filter((result) => result.passed).length,
            results
        };
    } finally {
        if (processResult) await stopProcess(processResult);
    }
}

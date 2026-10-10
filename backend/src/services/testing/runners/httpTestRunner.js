
import http from "http";

import {
    startProcess,
    stopProcess
} from "../../execution/processRunner.js";

const makeRequest = ({
    port,
    method = "GET",
    path = "/"
}) => {
    return new Promise((resolve, reject) => {
        const request = http.request(
            {
                hostname: "127.0.0.1",
                port,
                path,
                method,
                timeout: 3000
            },
            (response) => {
                let body = "";

                response.on("data", (chunk) => {
                    body += chunk;
                });

                response.on("end", () => {
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body
                    });
                });
            }
        );

        request.on("timeout", () => {
            request.destroy(
                new Error("HTTP request timed out")
            );
        });

        request.on("error", reject);
        request.end();
    });
};

const runCheck = async ({
    check,
    port
}) => {
    try {
        switch (check.type) {
            case "server_starts":
                // startProcess already waits for readiness.
                return {
                    passed: true,
                    check: check.type
                };

            case "http_request": {
                const actual = await makeRequest({
                    port,
                    method: "GET",
                    path: "/"
                });

                return {
                    passed: actual.statusCode !== undefined,
                    check: check.type,
                    actual
                };
            }

            case "http_response":
                // A valid HTTP response was received.
                {
                    const actual = await makeRequest({
                        port,
                        path: "/"
                    });

                    return {
                        passed:
                            Number.isInteger(actual.statusCode),
                        check: check.type,
                        actual
                    };
                }

            case "method_detection":
            case "path_detection":
            case "http_version_detection":
                // These require additional instrumentation to
                // verify parsing inside a raw TCP server.
                return {
                    passed: false,
                    check: check.type,
                    error:
                        "This check needs a dedicated TCP-level test."
                };

            case "status_code": {
                const actual = await makeRequest({
                    port,
                    method: check.config?.method || "GET",
                    path: check.config?.path || "/"
                });

                const expected =
                    check.config?.expectedStatus ?? 200;

                return {
                    passed: actual.statusCode === expected,
                    check: check.type,
                    actual: actual.statusCode,
                    expected
                };
            }

            case "headers": {
                const actual = await makeRequest({
                    port,
                    method: check.config?.method || "GET",
                    path: check.config?.path || "/"
                });

                const expectedHeader =
                    check.config?.header?.toLowerCase();

                const passed = expectedHeader
                    ? actual.headers[expectedHeader] !== undefined
                    : Object.keys(actual.headers).length > 0;

                return {
                    passed,
                    check: check.type,
                    actual: actual.headers,
                    expectedHeader
                };
            }

            case "response_body": {
                const actual = await makeRequest({
                    port,
                    method: check.config?.method || "GET",
                    path: check.config?.path || "/"
                });

                const expectedBody = check.config?.expectedBody;

                return {
                    passed: expectedBody !== undefined
                        ? actual.body.includes(expectedBody)
                        : actual.body.length > 0,
                    check: check.type,
                    actual: actual.body,
                    expected: expectedBody
                };
            }

            case "route": {
                const actual = await makeRequest({
                    port,
                    method: check.config?.method || "GET",
                    path: check.config?.path || "/"
                });

                const expectedStatus =
                    check.config?.expectedStatus ?? 200;

                const expectedBody =
                    check.config?.expectedBody;

                const passed =
                    actual.statusCode === expectedStatus &&
                    (
                        expectedBody === undefined ||
                        actual.body === expectedBody
                    );

                return {
                    passed,
                    check: check.type,
                    actual: {
                        statusCode: actual.statusCode,
                        body: actual.body
                    },
                    expected: {
                        statusCode: expectedStatus,
                        body: expectedBody
                    }
                };
            }

            case "unknown_route": {
                const actual = await makeRequest({
                    port,
                    method: "GET",
                    path: "/does-not-exist"
                });

                return {
                    passed:
                        actual.statusCode >= 400 &&
                        actual.statusCode < 500,
                    check: check.type,
                    actual: actual.statusCode
                };
            }

            default:
                return {
                    passed: false,
                    check: check.type,
                    error: `Unsupported HTTP check: ${check.type}`
                };
        }
    } catch (error) {
        return {
            passed: false,
            check: check.type,
            error: error.message
        };
    }
};

const runHttpTests = async ({
    testSpec,
    code,
    execution
}) => {
    let processResult;

    const results = [];

    try {
        processResult = await startProcess({
            code,
            execution
        });

        for (const check of testSpec.checks) {
            const result = await runCheck({
                check,
                port: processResult.port
            });

            results.push(result);
        }

        return {
            passed:
                results.length === testSpec.checks.length &&
                results.every((result) => result.passed),
            totalTests: testSpec.checks.length,
            passedTests: results.filter(
                (result) => result.passed
            ).length,
            results
        };
    } finally {
        if (processResult) {
            await stopProcess({
                child: processResult.child,
                workspace: processResult.workspace
            });
        }
    }
};

export default runHttpTests;

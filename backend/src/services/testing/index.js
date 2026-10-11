
import runHttpTests from "./runners/httpTestRunner.js";
import runTcpTests from "./runners/tcpTestRunner.js";
import runFunctionTests from "./runners/functionTestRunner.js";

const testRunners = {
    http: runHttpTests,
    tcp: runTcpTests
};

export const runTests = async ({
    testSpec,
    code,
    execution,
    language = "javascript",
    functionName,
    tests
}) => {
    if (!testSpec || !testSpec.type) {
        throw new Error("Test specification is missing");
    }

    if (testSpec.type === "function") {
        return runFunctionTests({ language, code, functionName, tests });
    }

    const runner = testRunners[testSpec.type];

    if (!runner) {
        throw new Error(
            `Unsupported test type: ${testSpec.type}`
        );
    }

    return runner({
        testSpec,
        code,
        execution
    });
};

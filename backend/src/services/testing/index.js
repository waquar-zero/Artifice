
import runHttpTests from "./runners/httpTestRunner.js";
import runTcpTests from "./runners/tcpTestRunner.js";

const testRunners = {
    http: runHttpTests,
    tcp: runTcpTests
};

export const runTests = async ({
    testSpec,
    code,
    execution
}) => {
    if (!testSpec || !testSpec.type) {
        throw new Error("Test specification is missing");
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

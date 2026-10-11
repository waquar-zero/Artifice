import { executeCode } from "../../execution/index.js";
import { checkResult } from "../resultChecker.js";
import { generateTestCode } from "../testGenerator.js";

export default async function runFunctionTests({
    language,
    code,
    functionName,
    tests
}) {
    if (!/^[A-Za-z_$][\w$]*$/.test(functionName || "")) {
        throw new Error("Function test configuration is missing a valid function name");
    }
    if (!Array.isArray(tests) || tests.length === 0) {
        throw new Error("Function test configuration must include test cases");
    }

    const results = [];
    for (const [index, test] of tests.entries()) {
        const label = test.name || `Example ${index + 1}`;
        const testCode = generateTestCode({
            language,
            code,
            functionName,
            input: test.input || []
        });

        let executionResult;
        try {
            executionResult = await executeCode({ language, code: testCode });
        } catch (error) {
            results.push({
                passed: false,
                check: "function_case",
                label,
                status: "execution_error",
                error: error.message
            });
            continue;
        }

        if (executionResult.status !== "passed") {
            results.push({
                passed: false,
                check: "function_case",
                label,
                status: executionResult.status,
                error: executionResult.stderr || "Function execution failed"
            });
            continue;
        }

        let actual;
        try {
            actual = JSON.parse(executionResult.stdout.trim());
        } catch {
            results.push({
                passed: false,
                check: "function_case",
                label,
                status: "invalid_output",
                actual: executionResult.stdout.trim(),
                expected: test.expectedOutput,
                error: "Function output was not a single JSON value"
            });
            continue;
        }

        results.push({
            ...checkResult({ actual, expected: test.expectedOutput }),
            check: "function_case",
            label,
            status: "completed"
        });
    }

    const passedTests = results.filter((result) => result.passed).length;
    return {
        passed: passedTests === results.length,
        totalTests: results.length,
        passedTests,
        results
    };
}

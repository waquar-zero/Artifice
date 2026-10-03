import { generateTestCode } from "./testGenerator.js";
import { checkResult } from "./resultChecker.js";
import { executeCode } from "../execution/index.js";

export const runTests = async ({
    language,
    code,
    functionName,
    tests
}) => {
    const results = [];

    for (const test of tests) {
        const testCode = generateTestCode({
            code,
            functionName,
            input: test.input
        });

        const executionResult = await executeCode({
            language,
            code: testCode
        });

        if (executionResult.status !== "passed") {
            results.push({
                passed: false,
                status: executionResult.status,
                actual: null,
                expected: test.expectedOutput,
                error: executionResult.stderr
            });

            continue;
        }

        const rawOutput = executionResult.stdout.trim();

        let actualOutput;

        try {
            actualOutput = JSON.parse(rawOutput);
        } catch {
            results.push({
                passed: false,
                status: "invalid_output",
                actual: rawOutput,
                expected: test.expectedOutput,
                error: "Invalid output"
            });

            continue;
        }

        results.push(
            checkResult({
                actual: actualOutput,
                expected: test.expectedOutput
            })
        );
    }

    const passed = results.every(
        result => result.passed
    );

    return {
        passed,
        totalTests: tests.length,
        passedTests: results.filter(
            result => result.passed
        ).length,
        results
    };
};
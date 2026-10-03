import { runTests } from "./services/testing/testRunner.js";

const result = await runTests({
    language: "javascript",

    code: `
        function add(a, b) {
            return a - b;
        }
    `,

    functionName: "add",

    tests: [
        {
            input: [2, 3],
            expectedOutput: 5
        },
        {
            input: [10, 20],
            expectedOutput: 30
        },
        {
            input: [-5, 10],
            expectedOutput: 5
        }
    ]
});

console.log(JSON.stringify(result, null, 2));
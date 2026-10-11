import runJavaScript from "./runners/javascriptRunner.js";
import runPython from "./runners/pythonRunner.js";

const runners = {
    javascript: runJavaScript,
    python: runPython
};

export const executeCode = async ({ language, code }) => {
    const runner = runners[language];

    if (!runner) {
        throw new Error(`Unsupported language: ${language}`);
    }

    return runner(code);
};

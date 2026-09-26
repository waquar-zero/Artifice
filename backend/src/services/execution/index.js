import runJavaScript from "./runners/javascriptRunner.js";

const runners = {
    javascript: runJavaScript
};

export const executeCode = async ({ language, code }) => {
    const runner = runners[language];

    if (!runner) {
        throw new Error(`Unsupported language: ${language}`);
    }

    return runner(code);
};
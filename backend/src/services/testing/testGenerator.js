export const generateTestCode = ({
    language = "javascript",
    code,
    functionName,
    input
}) => {
    if (language === "python") {
        const serializedInput = JSON.stringify(JSON.stringify(input));
        return `${code}\n\nimport json\n_result = ${functionName}(*json.loads(${serializedInput}))\nprint(json.dumps(_result, separators=(",", ":"), ensure_ascii=False))\n`;
    }

    return `
${code}

const result = ${functionName}(...${JSON.stringify(input)});

console.log(JSON.stringify(result));
`;
};

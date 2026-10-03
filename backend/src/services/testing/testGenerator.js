export const generateTestCode = ({
    code,
    functionName,
    input
}) => {
    return `
${code}

const result = ${functionName}(...${JSON.stringify(input)});

console.log(JSON.stringify(result));
`;
};
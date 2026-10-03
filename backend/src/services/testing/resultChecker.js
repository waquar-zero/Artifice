export const checkResult = ({
    actual,
    expected
}) => {
    const normalizedActual = JSON.stringify(actual);
    const normalizedExpected = JSON.stringify(expected);

    return {
        passed: normalizedActual === normalizedExpected,
        actual,
        expected
    };
};
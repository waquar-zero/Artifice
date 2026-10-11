import { isDeepStrictEqual } from "node:util";

export const checkResult = ({
    actual,
    expected
}) => {
    return {
        passed: isDeepStrictEqual(actual, expected),
        actual,
        expected
    };
};

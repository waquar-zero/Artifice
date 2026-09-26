import {
    executeCode
} from "../services/execution/index.js";

import {
    SUPPORTED_LANGUAGES
} from "../services/execution/types.js";

export const testCode = async (req, res) => {
    try {
        const { language, code } = req.body;

        if (!language || !code) {
            return res.status(400).json({
                success: false,
                message: "Language and code are required"
            });
        }

        if (!SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported language"
            });
        }

        const result = await executeCode({
            language,
            code
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Execution error:", error);

        res.status(500).json({
            success: false,
            message: "Code execution failed"
        });
    }
};
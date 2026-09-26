import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

const runJavaScript = async (code) => {
    const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "build-platform-")
    );

    const filePath = path.join(tempDir, "solution.js");

    try {
        await fs.writeFile(filePath, code, "utf8");

        const { stdout, stderr } = await execFileAsync(
            process.execPath,
            [filePath],
            {
                timeout: 3000,
                maxBuffer: 1024 * 1024
            }
        );

        return {
            status: "passed",
            stdout,
            stderr
        };
    } catch (error) {
        if (error.killed) {
            return {
                status: "timeout",
                stdout: error.stdout || "",
                stderr: "Execution timed out"
            };
        }

        return {
            status: "failed",
            stdout: error.stdout || "",
            stderr: error.stderr || error.message
        };
    } finally {
        await fs.rm(tempDir, {
            recursive: true,
            force: true
        });
    }
};

export default runJavaScript;
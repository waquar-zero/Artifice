
import fs from "fs/promises";
import os from "os";
import path from "path";
import net from "net";
import { spawn } from "child_process";

// 1. Create a unique temporary workspace
const createWorkspace = async () => {
    return fs.mkdtemp(
        path.join(os.tmpdir(), "build-platform-")
    );
};

// 2. Write student code into the workspace
const writeStudentCode = async ({
    workspace,
    entrypoint,
    code
}) => {
    const filePath = path.join(
        workspace,
        entrypoint
    );

    await fs.writeFile(filePath, code, "utf8");

    return filePath;
};

// 3. Wait until the configured port accepts connections
const waitForPort = async ({
    port,
    child,
    timeoutMs = 5000,
    intervalMs = 100
}) => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (
            child.exitCode !== null ||
            child.signalCode !== null
        ) {
            throw new Error(
                "Student process exited before becoming ready"
            );
        }

        const ready = await new Promise((resolve) => {
            const socket = net.createConnection({
                host: "127.0.0.1",
                port
            });

            socket.setTimeout(300);

            socket.once("connect", () => {
                socket.destroy();
                resolve(true);
            });

            socket.once("error", () => {
                socket.destroy();
                resolve(false);
            });

            socket.once("timeout", () => {
                socket.destroy();
                resolve(false);
            });
        });

        if (ready) {
            return;
        }

        await new Promise((resolve) => {
            setTimeout(resolve, intervalMs);
        });
    }

    throw new Error(
        `Server did not become ready on port ${port}`
    );
};

// 4. Stop the process with a bounded wait
const terminateProcess = async (
    child,
    timeoutMs = 2000
) => {
    if (
        !child ||
        child.exitCode !== null ||
        child.signalCode !== null
    ) {
        return;
    }

    await new Promise((resolve) => {
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            child.off("close", finish);
            resolve();
        };

        const timer = setTimeout(() => {
            child.kill("SIGKILL");
            finish();
        }, timeoutMs);

        child.once("close", finish);
        child.kill("SIGTERM");

        // Handle a process that exits immediately.
        if (
            child.exitCode !== null ||
            child.signalCode !== null
        ) {
            finish();
        }
    });
};

// 5. Public cleanup function
export const stopProcess = async ({
    child,
    workspace
}) => {
    try {
        await terminateProcess(child);
    } finally {
        if (workspace) {
            await fs.rm(workspace, {
                recursive: true,
                force: true
            });
        }
    }
};

// 6. Start the student's program and wait for readiness
export const startProcess = async ({
    code,
    execution
}) => {
    let workspace;
    let child;

    try {
        if (
            typeof code !== "string" ||
            !code.trim()
        ) {
            throw new Error("Student code is required");
        }

        if (
            !execution ||
            typeof execution.entrypoint !== "string" ||
            path.basename(execution.entrypoint) !==
                execution.entrypoint ||
            !/^[\w.-]+$/.test(execution.entrypoint) ||
            typeof execution.startCommand !== "string" ||
            !Number.isInteger(execution.port) ||
            execution.port < 1 ||
            execution.port > 65535
        ) {
            throw new Error(
                "Invalid execution configuration"
            );
        }

        const [command, ...args] =
            execution.startCommand.trim().split(/\s+/);

        if (!command || args.length === 0) {
            throw new Error(
                "Invalid start command"
            );
        }

        workspace = await createWorkspace();

        await writeStudentCode({
            workspace,
            entrypoint: execution.entrypoint,
            code
        });

        child = spawn(command, args, {
            cwd: workspace,
            shell: false,
            stdio: ["ignore", "pipe", "pipe"]
        });

        child.stdout.on("data", (data) => {
            console.log(
                `[student stdout] ${data.toString()}`
            );
        });

        child.stderr.on("data", (data) => {
            console.error(
                `[student stderr] ${data.toString()}`
            );
        });

        // Catch process startup errors, such as a missing command.
        await new Promise((resolve, reject) => {
            child.once("spawn", resolve);
            child.once("error", reject);
        });

        await waitForPort({
            port: execution.port,
            child
        });

        return {
            child,
            workspace,
            port: execution.port
        };
    } catch (error) {
        try {
            await stopProcess({
                child,
                workspace
            });
        } catch (cleanupError) {
            console.error(
                "Execution cleanup failed:",
                cleanupError.message
            );
        }

        throw error;
    }
};

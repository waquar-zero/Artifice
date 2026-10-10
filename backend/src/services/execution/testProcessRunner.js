
import {
    startProcess,
    stopProcess
} from "./processRunner.js";

const studentCode = `
const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("Hello from student code");
});

server.listen(3000);
`;

const execution = {
    entrypoint: "server.js",
    startCommand: "node server.js",
    port: 3000
};

let result;

try {
    result = await startProcess({
        code: studentCode,
        execution
    });

    console.log("Server is ready!");
    console.log("Workspace:", result.workspace);
    console.log("PID:", result.child.pid);
    console.log("Port:", result.port);

    // Keep the server running briefly for manual testing.
    await new Promise((resolve) => {
        setTimeout(resolve, 5000);
    });

} catch (error) {
    console.error("Test failed:", error.message);

} finally {
    if (result) {
        await stopProcess({
            child: result.child,
            workspace: result.workspace
        });

        console.log("Process stopped and workspace cleaned.");
    }
}

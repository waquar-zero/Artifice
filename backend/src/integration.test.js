import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import http from "node:http";
import { once } from "node:events";
import { randomUUID } from "node:crypto";

const configuredTestUri = process.env.TEST_MONGO_URI;
if (!configuredTestUri) {
    throw new Error("Set TEST_MONGO_URI to run the isolated integration suite");
}

const databaseName = `artifice_backend_test_${process.pid}`;
const testUrl = new URL(configuredTestUri);
testUrl.pathname = `/${databaseName}`;
process.env.MONGO_URI = testUrl.toString();
process.env.JWT_SECRET = process.env.JWT_SECRET || randomUUID();

const [{ default: app }, { default: User }, { default: Project }, { default: Sprint }, { default: Progress }, { default: Submission }, { default: bcrypt }] = await Promise.all([
    import("./app.js"),
    import("./models/User.js"),
    import("./models/Project.js"),
    import("./models/Sprint.js"),
    import("./models/Progress.js"),
    import("./models/Submission.js"),
    import("bcrypt")
]);

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
const server = http.createServer(app);
server.listen(0, "127.0.0.1");
await once(server, "listening");
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

const request = async (path, { method = "GET", token, body } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json() };
};

test("submission API persists results and enforces complete sprint progression", async () => {
    const suffix = randomUUID();
    let userId;
    let otherUserId;
    let projectId;
    let functionProjectId;
    let helloProjectId;
    let foreignProjectId;
    let sprintIds = [];
    try {
        const passwordHash = await bcrypt.hash("Integration-Password-123", 4);
        const [user, otherUser] = await User.create([
            { name: "Integration User", email: `integration-${suffix}@example.test`, passwordHash },
            { name: "Other User", email: `other-${suffix}@example.test`, passwordHash }
        ]);
        userId = user._id;
        otherUserId = otherUser._id;

        const login = await request("/auth/login", {
            method: "POST",
            body: { email: user.email, password: "Integration-Password-123" }
        });
        assert.equal(login.status, 200);
        const token = login.body.data.token;

        const project = await Project.create({
            title: "Integration Project",
            slug: `integration-${suffix}`,
            description: "Temporary API test fixture",
            difficulty: "beginner",
            language: "javascript",
            estimatedHours: 1,
            execution: { type: "process", entrypoint: "server.js", startCommand: "node server.js", port: 3000 }
        });
        projectId = project._id;
        const sprints = await Sprint.create([1, 2].map((order) => ({
            projectId,
            title: `Sprint ${order}`,
            goal: "Serve the expected response",
            order,
            testSpec: { type: "http", checks: [{ type: "route", config: { path: "/", expectedStatus: 200, expectedBody: "Hello" } }] }
        })));
        sprintIds = sprints.map((sprint) => sprint._id);

        const unauthorized = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", body: { code: "", language: "javascript" }
        });
        assert.equal(unauthorized.status, 401);
        const invalidAuth = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", token: "invalid-token", body: { code: "x", language: "javascript" }
        });
        assert.equal(invalidAuth.status, 401);

        const started = await request(`/progress/${projectId}`, { token });
        assert.equal(started.status, 200);
        assert.equal(String(started.body.data.currentSprint._id), String(sprintIds[0]));

        const invalid = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", token, body: { code: " ", language: "javascript" }
        });
        assert.equal(invalid.status, 400);

        const wrongLanguage = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", token, body: { code: "x", language: "python" }
        });
        assert.equal(wrongLanguage.status, 400);

        const missingProject = await request(`/submissions/projects/${new mongoose.Types.ObjectId()}/sprints/${sprintIds[0]}`, {
            method: "POST", token, body: { code: "x", language: "javascript" }
        });
        assert.equal(missingProject.status, 404);

        const foreignProject = await Project.create({
            title: "Foreign Integration Project",
            slug: `foreign-${suffix}`,
            description: "Temporary API test fixture",
            difficulty: "beginner",
            language: "javascript",
            estimatedHours: 1,
            execution: { type: "process", entrypoint: "server.js", startCommand: "node server.js", port: 3000 }
        });
        foreignProjectId = foreignProject._id;
        const [foreignSprint] = await Sprint.create([{
            projectId: foreignProjectId,
            title: "Foreign Sprint",
            goal: "Check project ownership",
            order: 1,
            testSpec: { type: "http", checks: [] }
        }]);
        const wrongProjectSprint = await request(`/submissions/projects/${projectId}/sprints/${foreignSprint._id}`, {
            method: "POST", token, body: { code: "x", language: "javascript" }
        });
        assert.equal(wrongProjectSprint.status, 404);

        const codeFor = (body) => `const http = require("http"); http.createServer((req, res) => { res.writeHead(200); res.end(${JSON.stringify(body)}); }).listen(3000, "127.0.0.1");`;
        const failed = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", token, body: { code: codeFor("Nope"), language: "javascript" }
        });
        assert.equal(failed.status, 201);
        assert.equal(failed.body.data.submission.status, "failed");
        assert.equal(failed.body.data.progress.currentSprint.toString(), String(sprintIds[0]));
        assert.equal(failed.body.data.tests.passed, false);

        const passed = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", token, body: { code: codeFor("Hello"), language: "javascript" }
        });
        assert.equal(passed.status, 201);
        assert.equal(passed.body.data.submission.status, "passed");
        assert.equal(passed.body.data.progress.completedSprints.length, 1);
        assert.equal(String(passed.body.data.progress.currentSprint), String(sprintIds[1]));

        const locked = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", token, body: { code: codeFor("Hello"), language: "javascript" }
        });
        assert.equal(locked.status, 403);

        await Sprint.updateOne({ _id: sprintIds[1] }, { $set: { testSpec: { type: "cli", checks: [] } } });
        const unsupported = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[1]}`, {
            method: "POST", token, body: { code: codeFor("Hello"), language: "javascript" }
        });
        assert.equal(unsupported.status, 400);
        await Sprint.updateOne({ _id: sprintIds[1] }, { $set: { testSpec: { type: "http", checks: [{ type: "route", config: { path: "/", expectedStatus: 200, expectedBody: "Hello" } }] } } });

        const completed = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[1]}`, {
            method: "POST", token, body: { code: codeFor("Hello"), language: "javascript" }
        });
        assert.equal(completed.status, 201);
        assert.equal(completed.body.data.progress.currentSprint, null);
        assert.equal(completed.body.data.progress.completedSprints.length, 2);

        const history = await request(`/submissions/projects/${projectId}`, { token });
        assert.equal(history.status, 200);
        assert.equal(history.body.data.length, 3);
        assert.ok(history.body.data.every((item) => !Object.hasOwn(item, "code")));

        const otherLogin = await request("/auth/login", {
            method: "POST",
            body: { email: otherUser.email, password: "Integration-Password-123" }
        });
        const otherHistory = await request(`/submissions/projects/${projectId}`, { token: otherLogin.body.data.token });
        assert.deepEqual(otherHistory.body.data, []);

        const stored = await Submission.find({ projectId, userId }).sort({ createdAt: 1 });
        assert.deepEqual(stored.map((item) => item.status), ["failed", "passed", "passed"]);
        assert.equal(stored[0].testResults.passed, false);
        assert.equal(stored[1].testResults.passed, true);

        const held = await Project.findByIdAndUpdate(projectId, { $set: { availability: "coming_soon" } }, { new: true });
        assert.equal(held.availability, "coming_soon");
        const heldProgress = await request(`/progress/${projectId}`, { token });
        assert.equal(heldProgress.status, 403);
        const heldSubmission = await request(`/submissions/projects/${projectId}/sprints/${sprintIds[0]}`, {
            method: "POST", token, body: { code: codeFor("Hello"), language: "javascript" }
        });
        assert.equal(heldSubmission.status, 403);

        const functionProject = await Project.create({
            title: "Text Analyzer Fixture", slug: `function-${suffix}`, description: "Function runner fixture",
            difficulty: "beginner", language: "javascript", estimatedHours: 1,
            execution: { type: "process", entrypoint: "solution.js", startCommand: "node solution.js", port: 3000 }
        });
        functionProjectId = functionProject._id;
        const [functionSprint] = await Sprint.create([{
            projectId: functionProjectId, title: "Count words", goal: "Count words in a string", order: 1,
            functionName: "countWords",
            tests: [
                { label: "Counts words", input: ["one two three"], expectedOutput: 3 },
                { label: "Ignores repeated spaces", input: ["  one   two  "], expectedOutput: 2 },
                { label: "Empty text", input: [""], expectedOutput: 0 }
            ],
            testSpec: { type: "function", checks: [] }
        }]);
        const functionStart = await request(`/progress/${functionProjectId}`, { token });
        assert.equal(functionStart.status, 200);
        const functionRun = async (code) => request(`/submissions/projects/${functionProjectId}/sprints/${functionSprint._id}`, {
            method: "POST", token, body: { code, language: "javascript" }
        });
        const functionFailed = await functionRun('function countWords(text) { return text.split(" ").length; }');
        assert.equal(functionFailed.status, 201);
        assert.equal(functionFailed.body.data.submission.status, "failed");
        assert.equal(functionFailed.body.data.tests.totalTests - functionFailed.body.data.tests.passedTests, 2);
        assert.equal(String(functionFailed.body.data.progress.currentSprint), String(functionSprint._id));
        const functionPassed = await functionRun('function countWords(text) { return text.trim() ? text.trim().split(/\\s+/).length : 0; }');
        assert.equal(functionPassed.status, 201);
        assert.equal(functionPassed.body.data.submission.status, "passed");
        assert.equal(functionPassed.body.data.tests.totalTests, 3);
        assert.equal(functionPassed.body.data.tests.passedTests, 3);

        const helloPort = 32000 + (process.pid % 1000);
        const helloProject = await Project.create({
            title: "Hello Server Fixture", slug: `hello-${suffix}`, description: "HTTP project fixture",
            difficulty: "beginner", language: "javascript", estimatedHours: 1,
            execution: { type: "process", entrypoint: "server.js", startCommand: "node server.js", port: helloPort }
        });
        helloProjectId = helloProject._id;
        const helloSprints = await Sprint.create([
            {
                projectId: helloProjectId, title: "Say hello", goal: "Respond to the home page", order: 1,
                testSpec: { type: "http", checks: [
                    { type: "server_starts" },
                    { type: "route", config: { path: "/", expectedStatus: 200, expectedBody: "Hello, world!" } }
                ] }
            },
            {
                projectId: helloProjectId, title: "Add an about page", goal: "Add routes", order: 2,
                testSpec: { type: "http", checks: [
                    { type: "server_starts" },
                    { type: "route", config: { path: "/", expectedStatus: 200, expectedBody: "Hello, world!" } },
                    { type: "route", config: { path: "/about", expectedStatus: 200, expectedBody: "About this project" } },
                    { type: "unknown_route", config: { path: "/missing", expectedStatus: 404 } }
                ] }
            }
        ]);
        const helloStart = await request(`/progress/${helloProjectId}`, { token });
        assert.equal(helloStart.status, 200);
        const helloCode = (routes) => `const http = require("node:http"); http.createServer((req, res) => { const routes = ${JSON.stringify(routes)}; const route = routes[req.url]; res.writeHead(route ? route.status : 404, { "Content-Type": "text/plain" }); res.end(route?.body || "Not found"); }).listen(${helloPort});`;
        const helloFirst = await request(`/submissions/projects/${helloProjectId}/sprints/${helloSprints[0]._id}`, {
            method: "POST", token, body: { code: helloCode({ "/": { status: 200, body: "Hello, world!" } }), language: "javascript" }
        });
        assert.equal(helloFirst.status, 201);
        assert.equal(helloFirst.body.data.submission.status, "passed");
        const helloSecond = await request(`/submissions/projects/${helloProjectId}/sprints/${helloSprints[1]._id}`, {
            method: "POST", token, body: { code: helloCode({
                "/": { status: 200, body: "Hello, world!" },
                "/about": { status: 200, body: "About this project" }
            }), language: "javascript" }
        });
        assert.equal(helloSecond.status, 201);
        assert.equal(helloSecond.body.data.submission.status, "passed");
        assert.equal(helloSecond.body.data.tests.passedTests, 4);
    } finally {
        if (projectId) {
            await Submission.deleteMany({ projectId });
            await Progress.deleteMany({ projectId });
            await Sprint.deleteMany({ projectId });
            await Project.deleteOne({ _id: projectId });
        }
        if (functionProjectId) {
            await Submission.deleteMany({ projectId: functionProjectId });
            await Progress.deleteMany({ projectId: functionProjectId });
            await Sprint.deleteMany({ projectId: functionProjectId });
            await Project.deleteOne({ _id: functionProjectId });
        }
        if (helloProjectId) {
            await Submission.deleteMany({ projectId: helloProjectId });
            await Progress.deleteMany({ projectId: helloProjectId });
            await Sprint.deleteMany({ projectId: helloProjectId });
            await Project.deleteOne({ _id: helloProjectId });
        }
        if (foreignProjectId) {
            await Sprint.deleteMany({ projectId: foreignProjectId });
            await Project.deleteOne({ _id: foreignProjectId });
        }
        if (userId || otherUserId) await User.deleteMany({ _id: { $in: [userId, otherUserId].filter(Boolean) } });
        server.close();
        await once(server, "close");
        await mongoose.disconnect();
    }
});

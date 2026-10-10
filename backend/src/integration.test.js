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
    } finally {
        if (projectId) {
            await Submission.deleteMany({ projectId });
            await Progress.deleteMany({ projectId });
            await Sprint.deleteMany({ projectId });
            await Project.deleteOne({ _id: projectId });
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

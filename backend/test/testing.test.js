import { test } from "node:test";
import assert from "node:assert/strict";
import { runTests } from "../src/services/testing/index.js";

test("unsupported test types fail explicitly", async () => {
    await assert.rejects(
        runTests({ testSpec: { type: "unknown", checks: [] }, code: "", execution: {} }),
        /Unsupported test type: unknown/
    );
});

test("missing test specifications fail explicitly", async () => {
    await assert.rejects(
        runTests({ code: "", execution: {} }),
        /Test specification is missing/
    );
});

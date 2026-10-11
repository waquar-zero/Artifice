import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import projectRoutes from "./routes/projectRoutes.js";
import sprintRoutes from "./routes/sprintRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import hintRoutes from "./routes/hintRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import runnerRoutes from "./routes/runnerRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import postRoutes from "./routes/postRoutes.js";

const app = express();
const frontendDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../frontend"
);

const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

app.use(cors({
    origin(origin, callback) {
        // Same-origin requests do not need CORS; allow command-line and server-to-server calls.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(null, false);
    }
}));
app.use(express.json());
app.use(express.static(frontendDirectory));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "build-platform-api"
    });
});

app.use("/api/projects", projectRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/sprints", hintRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/runner", runnerRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);

export default app;

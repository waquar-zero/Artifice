import express from "express";
import cors from "cors";

import projectRoutes from "./routes/projectRoutes.js";
import sprintRoutes from "./routes/sprintRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import hintRoutes from "./routes/hintRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import runnerRoutes from "./routes/runnerRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

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

export default app;
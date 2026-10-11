import express from "express";

import { getProgress, restartProject } from "../controllers/progressController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/:projectId",
    authMiddleware,
    getProgress
);

router.post(
    "/:projectId/restart",
    authMiddleware,
    restartProject
);

export default router;

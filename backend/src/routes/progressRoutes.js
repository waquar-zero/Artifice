import express from "express";

import {
    getProgress,
    completeSprint
} from "../controllers/progressController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/:projectId",
    authMiddleware,
    getProgress
);

router.post(
    "/:projectId/sprints/:sprintId/complete",
    authMiddleware,
    completeSprint
);

export default router;
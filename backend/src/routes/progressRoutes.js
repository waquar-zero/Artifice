import express from "express";

import { getProgress } from "../controllers/progressController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/:projectId",
    authMiddleware,
    getProgress
);

export default router;

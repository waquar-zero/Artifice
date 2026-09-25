import express from "express";

import { getHints } from "../controllers/hintController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/:sprintId/hints",
    authMiddleware,
    getHints
);

export default router;
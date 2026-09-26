import express from "express";

import {
    testCode
} from "../controllers/runnerController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/test",
    authMiddleware,
    testCode
);

export default router;
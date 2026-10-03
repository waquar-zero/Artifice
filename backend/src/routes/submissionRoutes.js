import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createSubmission } from "../controllers/submissionController.js";

const router = express.Router();

router.post(
    "/projects/:projectId/sprints/:sprintId",
    authMiddleware,
    createSubmission
);

export default router;
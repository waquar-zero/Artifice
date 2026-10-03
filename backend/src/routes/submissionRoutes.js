import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    createSubmission,
    getSubmissions
} from "../controllers/submissionController.js";

const router = express.Router();

router.post(
    "/projects/:projectId/sprints/:sprintId",
    authMiddleware,
    createSubmission
);

router.get(
    "/projects/:projectId",
    authMiddleware,
    getSubmissions
);

export default router;
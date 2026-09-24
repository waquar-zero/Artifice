import express from "express";

import {
    getSprintsByProject,
    getSprintById
} from "../controllers/sprintController.js";

const router = express.Router();

router.get("/project/:projectId", getSprintsByProject);
router.get("/:id", getSprintById);

export default router;
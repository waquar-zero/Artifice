import Submission from "../models/Submission.js";
import Sprint from "../models/Sprint.js";
import Progress from "../models/Progress.js";

export const createSubmission = async (req, res) => {
    try {
        const { projectId, sprintId } = req.params;
        const { code, language } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Code is required"
            });
        }

        const sprint = await Sprint.findOne({
            _id: sprintId,
            projectId
        });

        if (!sprint) {
            return res.status(404).json({
                success: false,
                message: "Sprint not found in this project"
            });
        }

        const progress = await Progress.findOne({
            userId: req.userId,
            projectId
        });

        if (!progress) {
            return res.status(403).json({
                success: false,
                message: "Project has not been started"
            });
        }

        const isCurrent =
            progress.currentSprint &&
            progress.currentSprint.toString() === sprintId;

        if (!isCurrent) {
            return res.status(403).json({
                success: false,
                message: "You can only submit the current sprint"
            });
        }

        const submission = await Submission.create({
            userId: req.userId,
            projectId,
            sprintId,
            language: language || "javascript",
            code,
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Submission received",
            data: submission
        });
    } catch (error) {
        console.error("Create submission error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create submission"
        });
    }
};
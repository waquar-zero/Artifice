import Progress from "../models/Progress.js";
import Project from "../models/Project.js";
import Sprint from "../models/Sprint.js";

export const getProgress = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        let progress = await Progress.findOne({
            userId: req.userId,
            projectId
        }).populate("currentSprint");

        if (!progress) {
            const firstSprint = await Sprint.findOne({
                projectId
            }).sort({ order: 1 });

            if (!firstSprint) {
                return res.status(404).json({
                    success: false,
                    message: "Project has no sprints"
                });
            }

            progress = await Progress.create({
                userId: req.userId,
                projectId,
                completedSprints: [],
                currentSprint: firstSprint._id
            });

            await progress.populate("currentSprint");
        }

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error("Get progress error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch progress"
        });
    }
};

export const completeSprint = async (req, res) => {
    try {
        const { projectId, sprintId } = req.params;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
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

        let progress = await Progress.findOne({
            userId: req.userId,
            projectId
        });

        if (!progress) {
            return res.status(400).json({
                success: false,
                message: "Project has not been started"
            });
        }

        const alreadyCompleted = progress.completedSprints.some(
            (id) => id.toString() === sprintId
        );

        if (alreadyCompleted) {
            return res.status(400).json({
                success: false,
                message: "Sprint already completed"
            });
        }

        if (
            !progress.currentSprint ||
            progress.currentSprint.toString() !== sprintId
        ) {
            return res.status(403).json({
                success: false,
                message: "This sprint is not currently unlocked"
            });
        }

        progress.completedSprints.push(sprint._id);

        const nextSprint = await Sprint.findOne({
            projectId,
            order: sprint.order + 1
        });

        if (nextSprint) {
            progress.currentSprint = nextSprint._id;
        } else {
            progress.currentSprint = null;
        }

        await progress.save();

        await progress.populate("currentSprint");

        res.status(200).json({
            success: true,
            message: nextSprint
                ? "Sprint completed. Next sprint unlocked."
                : "Project completed.",
            data: progress
        });
    } catch (error) {
        console.error("Complete sprint error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to complete sprint"
        });
    }
};
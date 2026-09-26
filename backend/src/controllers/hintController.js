import Sprint from "../models/Sprint.js";
import Progress from "../models/Progress.js";

export const getHints = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const level = Number(req.query.level || 1);

        const sprint = await Sprint.findById(sprintId);

        if (!sprint) {
            return res.status(404).json({
                success: false,
                message: "Sprint not found"
            });
        }

        const progress = await Progress.findOne({
            userId: req.userId,
            projectId: sprint.projectId
        });

        if (!progress) {
            return res.status(403).json({
                success: false,
                message: "Project has not been started"
            });
        }

        const isCompleted = progress.completedSprints.some(
            (id) => id.toString() === sprintId
        );

        const isCurrent =
            progress.currentSprint &&
            progress.currentSprint.toString() === sprintId;

        if (!isCurrent && !isCompleted) {
            return res.status(403).json({
                success: false,
                message: "This sprint is not unlocked"
            });
        }

        if (
            !Number.isInteger(level) ||
            level < 1 ||
            level > sprint.hints.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid hint level"
            });
        }

        const hints = sprint.hints.slice(0, level);

        res.status(200).json({
            success: true,
            data: {
                level,
                hints
            }
        });
    } catch (error) {
        console.error("Get hints error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch hints"
        });
    }
};

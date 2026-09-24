import Sprint from "../models/Sprint.js";

export const getSprintsByProject = async (req, res) => {
    try {
        const sprints = await Sprint.find({
            projectId: req.params.projectId
        }).sort({ order: 1 });

        res.status(200).json({
            success: true,
            count: sprints.length,
            data: sprints
        });
    } catch (error) {
        console.error("Get sprints error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sprints"
        });
    }
};

export const getSprintById = async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id);

        if (!sprint) {
            return res.status(404).json({
                success: false,
                message: "Sprint not found"
            });
        }

        res.status(200).json({
            success: true,
            data: sprint
        });
    } catch (error) {
        console.error("Get sprint error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sprint"
        });
    }
};
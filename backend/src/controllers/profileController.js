import Progress from "../models/Progress.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";

export const getProfile = async (req, res) => {
    try {
        const [user, progressRecords, submissions] = await Promise.all([
            User.findById(req.userId).select("name email createdAt"),
            Progress.find({ userId: req.userId })
                .populate("projectId", "title slug description difficulty language")
                .populate("currentSprint", "title order")
                .populate("completedSprints", "title order")
                .sort({ updatedAt: -1 }),
            Submission.find({ userId: req.userId })
                .populate("projectId", "title slug")
                .populate("sprintId", "title order")
                .sort({ createdAt: -1 })
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const projects = progressRecords
            .filter((progress) => progress.projectId)
            .map((progress) => ({
                project: progress.projectId,
                currentSprint: progress.currentSprint,
                completedSprints: progress.completedSprints,
                status: progress.currentSprint ? "in_progress" : "completed",
                updatedAt: progress.updatedAt
            }));

        return res.status(200).json({
            success: true,
            data: {
                user,
                projects,
                submissions: submissions
                    .filter((submission) => submission.projectId && submission.sprintId)
                    .map((submission) => ({
                        id: submission._id,
                        project: submission.projectId,
                        sprint: submission.sprintId,
                        language: submission.language,
                        code: submission.code,
                        status: submission.status,
                        testResults: submission.testResults,
                        createdAt: submission.createdAt
                    }))
            }
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};

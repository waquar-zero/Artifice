import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        completedSprints: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Sprint"
            }
        ],

        currentSprint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sprint",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// One progress record per user per project
progressSchema.index(
    { userId: 1, projectId: 1 },
    { unique: true }
);

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
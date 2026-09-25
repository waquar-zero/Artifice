import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
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

        sprintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sprint",
            required: true
        },

        language: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
        },  

        code: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "passed", "failed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

const Submission = mongoose.model(
    "Submission",
    submissionSchema
);

export default Submission;
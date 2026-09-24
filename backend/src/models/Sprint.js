import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        order: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        goal: {
            type: String,
            required: true
        },

        requirements: {
            type: [String],
            default: []
        },

        constraints: {
            type: [String],
            default: []
        },

        definitionOfDone: {
            type: [String],
            default: []
        },

        hints: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;
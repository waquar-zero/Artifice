import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        // Main objective of the sprint
        goal: {
            type: String,
            required: true,
            trim: true
        },

        order: {
            type: Number,
            required: true
        },

        requirements: [
            {
                type: String,
                trim: true
            }
        ],

        constraints: [
            {
                type: String,
                trim: true
            }
        ],

        definitionOfDone: [
            {
                type: String,
                trim: true
            }
        ],

        // Progressive hints
        hints: [
            {
                type: String,
                trim: true
            }
        ],

        // Optional fields for function-based challenges.
        // HTTP/server projects do not need these.
        functionName: {
            type: String,
            trim: true
        },

        tests: [
            {
                input: {
                    type: [mongoose.Schema.Types.Mixed]
                },

                expectedOutput: {
                    type: mongoose.Schema.Types.Mixed
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;
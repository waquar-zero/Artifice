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

        hints: [
            {
                type: String,
                trim: true
            }
        ],

        starterCode: {
            type: String,
            default: ""
        },
        starterCodeByLanguage: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // Optional function-based challenge metadata
        functionName: {
            type: String,
            trim: true
        },

        tests: [
            {
                name: { type: String, trim: true },
                input: {
                    type: [mongoose.Schema.Types.Mixed]
                },

                expectedOutput: {
                    type: mongoose.Schema.Types.Mixed
                }
            }
        ],

        // Generic testing specification
        testSpec: {
            type: {
                type: String,
                enum: [
                    "none",
                    "function",
                    "http",
                    "tcp",
                    "cli"
                ],
                default: "none"
            },

            checks: [
                {
                    type: {
                        type: String,
                        required: true
                    },

                    config: {
                        type: mongoose.Schema.Types.Mixed
                    }
                }
            ]
        }
    },
    {
        timestamps: true
    }
);

const Sprint = mongoose.model("Sprint", sprintSchema);

export default Sprint;

import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            required: true
        },

        language: {
            type: String,
            required: true
        },
        supportedLanguages: [{
            type: String,
            enum: ["javascript", "python"]
        }],

        estimatedHours: {
            type: Number,
            required: true
        },
        availability: {
            type: String,
            enum: ["active", "coming_soon"],
            default: "active"
        },
        learningGuide: {
            introduction: { type: String, trim: true, default: "" },
            sections: [{
                title: { type: String, trim: true },
                body: { type: String, trim: true }
            }]
        },
        execution: {
            type: {
            type: String,
            enum: ["process"],
            default: "process"
        },
        entrypoint: {
            type: String,
            required: true
        },
        startCommand: {
            type: String,
            required: true
        },
        port: {
            type: Number
        }
    }
    },
    {
        timestamps: true
    }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;

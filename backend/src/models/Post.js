import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 4,
            maxlength: 120
        },
        topic: {
            type: String,
            trim: true,
            maxlength: 32,
            default: "Tech"
        },
        body: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 5000
        }
    },
    { timestamps: true }
);

postSchema.index({ createdAt: -1 });

export default mongoose.model("Post", postSchema);

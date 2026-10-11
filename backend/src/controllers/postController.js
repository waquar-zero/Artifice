import mongoose from "mongoose";
import Post from "../models/Post.js";

function validPostId(postId, res) {
    if (mongoose.isValidObjectId(postId)) return true;
    res.status(404).json({ success: false, message: "Post not found" });
    return false;
}

function readPostFields(body = {}) {
    return {
        title: typeof body.title === "string" ? body.title.trim() : "",
        topic: typeof body.topic === "string" ? body.topic.trim() : "Tech",
        body: typeof body.body === "string" ? body.body.trim() : ""
    };
}

function validatePostFields({ title, topic, body }, res) {
    if (title.length < 4 || title.length > 120) {
        res.status(400).json({ success: false, message: "Title must be between 4 and 120 characters" });
        return false;
    }
    if (body.length < 10 || body.length > 5000) {
        res.status(400).json({ success: false, message: "Post text must be between 10 and 5000 characters" });
        return false;
    }
    if (topic.length > 32) {
        res.status(400).json({ success: false, message: "Topic must be 32 characters or fewer" });
        return false;
    }
    return true;
}

export const listPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(30)
            .populate("authorId", "name");

        return res.status(200).json({ success: true, data: posts });
    } catch (error) {
        console.error("List community posts error:", error);
        return res.status(500).json({ success: false, message: "Failed to load community posts" });
    }
};

export const listMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ authorId: req.userId })
            .sort({ createdAt: -1 })
            .populate("authorId", "name");

        return res.status(200).json({ success: true, data: posts });
    } catch (error) {
        console.error("List my posts error:", error);
        return res.status(500).json({ success: false, message: "Failed to load your posts" });
    }
};

export const createPost = async (req, res) => {
    try {
        const fields = readPostFields(req.body);
        if (!validatePostFields(fields, res)) return;

        const post = await Post.create({
            authorId: req.userId,
            ...fields,
            topic: fields.topic || "Tech"
        });
        await post.populate("authorId", "name");

        return res.status(201).json({ success: true, message: "Post published", data: post });
    } catch (error) {
        console.error("Create community post error:", error);
        return res.status(500).json({ success: false, message: "Failed to publish post" });
    }
};

export const updatePost = async (req, res) => {
    try {
        if (!validPostId(req.params.postId, res)) return;
        const fields = readPostFields(req.body);
        if (!validatePostFields(fields, res)) return;

        const post = await Post.findOneAndUpdate(
            { _id: req.params.postId, authorId: req.userId },
            { ...fields, topic: fields.topic || "Tech" },
            { new: true, runValidators: true }
        ).populate("authorId", "name");

        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        return res.status(200).json({ success: true, message: "Post updated", data: post });
    } catch (error) {
        console.error("Update community post error:", error);
        return res.status(500).json({ success: false, message: "Failed to update post" });
    }
};

export const deletePost = async (req, res) => {
    try {
        if (!validPostId(req.params.postId, res)) return;
        const post = await Post.findOneAndDelete({
            _id: req.params.postId,
            authorId: req.userId
        });
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        return res.status(200).json({ success: true, message: "Post deleted" });
    } catch (error) {
        console.error("Delete community post error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete post" });
    }
};

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createPost, deletePost, listPosts, updatePost } from "../controllers/postController.js";

const router = express.Router();

router.get("/", listPosts);
router.post("/", authMiddleware, createPost);
router.patch("/:postId", authMiddleware, updatePost);
router.delete("/:postId", authMiddleware, deletePost);

export default router;

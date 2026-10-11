import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const googleClient = new OAuth2Client();

const issueToken = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

export const getAuthConfig = (_req, res) => res.status(200).json({
    success: true,
    data: { googleClientId: process.env.GOOGLE_CLIENT_ID || "" }
});

export const register = async (req, res) => {
    return res.status(410).json({
        success: false,
        message: "Create an account securely with Google sign-in"
    });
};

export const googleLogin = async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const credential = req.body?.credential;
        if (!clientId) return res.status(503).json({ success: false, message: "Google sign-in is not configured yet" });
        if (typeof credential !== "string" || !credential) return res.status(400).json({ success: false, message: "Google credential is required" });

        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email || payload.email_verified !== true) {
            return res.status(401).json({ success: false, message: "Use a Google account with a verified email address" });
        }

        const email = payload.email.toLowerCase().trim();
        const displayName = String(payload.name || email.split("@")[0] || "Google user").trim().slice(0, 50);
        let user = await User.findOne({ googleId: payload.sub }).select("+googleId");
        if (!user) {
            user = await User.findOne({ email }).select("+googleId");
            if (user) {
                if (user.googleId && user.googleId !== payload.sub) {
                    return res.status(409).json({ success: false, message: "This email is linked to a different Google account" });
                }
                user.googleId = payload.sub;
                user.authProvider = "google";
                if (!user.name && payload.name) user.name = payload.name.slice(0, 50);
                await user.save();
            } else {
                user = await User.create({
                    name: displayName.length >= 2 ? displayName : "Google user",
                    email,
                    googleId: payload.sub,
                    authProvider: "google"
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Google sign-in successful",
            data: { token: issueToken(user), user: publicUser(user) }
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: "This Google account is already linked. Please sign in again." });
        }
        console.error("Google sign-in error:", error);
        return res.status(401).json({ success: false, message: "Google sign-in could not be verified" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const passwordMatches = user.passwordHash && await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = issueToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: publicUser(user)
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-passwordHash -googleId");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Get me error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user"
        });
    }
};

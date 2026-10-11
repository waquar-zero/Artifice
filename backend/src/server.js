
import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const validateEnvironment = () => {
    const missing = ["MONGO_URI", "JWT_SECRET"].filter((name) => !process.env[name]);
    if (missing.length) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must contain at least 32 characters in production");
    }
};

const startServer = async () => {
    validateEnvironment();
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();

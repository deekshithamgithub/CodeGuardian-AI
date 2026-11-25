import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import explainRoutes from "./routes/explainRoutes.js";
import fixRoutes from "./routes/fixRoutes.js";
import fixHistoryRoutes from "./routes/fixHistoryRoutes.js";
import githubRoutes from "./routes/githubRoutes.js";
dotenv.config();
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
}

if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL is missing");
}
const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({
    extended: false,
    limit: "1mb"
}));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/explanations", explainRoutes);
app.use("/api/fixes", fixRoutes);
app.use("/api/fix-history", fixHistoryRoutes);
app.use("/api/github", githubRoutes);
// Health check API
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CodeGuardian AI Backend is running!"
    });
});
app.use((err, req, res, next) => {
    console.error("Global error:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.status && err.status < 500
            ? err.message
            : "Internal server error",
    });
});
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
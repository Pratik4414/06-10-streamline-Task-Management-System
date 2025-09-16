import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";

import configurePassport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js"; // Import new routes
import taskRoutes from "./routes/tasks.js";     // Import new routes
import teamRoutes from "./routes/team.js";       // Import new routes
import reportRoutes from "./routes/reports.js";

const app = express();
configurePassport(passport);

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB Error", err));

app.use(passport.initialize());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes); // Use new routes
app.use("/api/tasks", taskRoutes);     // Use new routes
app.use("/api/team", teamRoutes);       // Use new routes
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// 1. Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
let mongoConnectionPromise = null;

function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  if (!mongoConnectionPromise) {
    if (!process.env.MONGO_URI) {
      return Promise.reject(new Error("MONGO_URI is not configured"));
    }

    mongoConnectionPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
      mongoConnectionPromise = null;
      throw error;
    });
  }

  return mongoConnectionPromise;
}

// 2. Middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// 3. Sample Route (Health Check)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Bug Tracker API is running..." });
});

app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/auth", require("../routes/auth.route"));
app.use("/api/projects", require("../routes/project.route"));
app.use("/api/ai", require("../routes/ai.route"));
app.use("/api/test-cases", require("../routes/testCase.route"));
app.use("/api/tests", require("../routes/testRun.route"));
app.use("/api/automation", require("../routes/automation.route"));
app.use("/api/bugs", require("../routes/bug.route"));
app.use("/api/bug", require("../routes/bug.route"));
app.use("/api/companies", require("../routes/company.route"));
app.use("/api/users", require("../routes/user.route"));
app.use("/api/roles", require("../routes/role.route"));
app.use("/api/master-data", require("../routes/masterData.route"));
app.use("/api/locations", require("../routes/location.route"));
app.use("/api/settings", require("../routes/settings.route"));

// 4. Database Connection & Server Start
if (!process.env.VERCEL) {
  connectMongo()
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Database connection error:", err.message);
    });
}

module.exports = app;

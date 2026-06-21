const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

// 1. Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Parses incoming JSON requests
// app.use(morgan("dev")); // Logs requests to the console
app.use(express.urlencoded({ extended: true, limit: "5mb" })); // Parses URL-encoded data
app.use("/api/auth", require("../routes/auth.route")); // Authentication routes
app.use("/api/projects", require("../routes/project.route"));
app.use("/api/ai", require("../routes/ai.route"));
app.use("/api/test-cases", require("../routes/testCase.route"));
app.use("/api/tests", require("../routes/testRun.route"));
app.use("/api/bugs", require("../routes/bug.route"));
app.use("/api/bug", require("../routes/bug.route"));
app.use("/api/companies", require("../routes/company.route"));
app.use("/api/users", require("../routes/user.route"));
app.use("/api/roles", require("../routes/role.route"));
app.use("/api/master-data", require("../routes/masterData.route"));
app.use("/api/locations", require("../routes/location.route"));
app.use("/api/settings", require("../routes/settings.route"));

// 3. Sample Route (Health Check)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Bug Tracker API is running..." });
});

// 4. Database Connection & Server Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    // app.listen(PORT, () => {
    //   console.log(`🚀 Server running on http://localhost:${PORT}`);
    // });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
  });

  module.exports = app;

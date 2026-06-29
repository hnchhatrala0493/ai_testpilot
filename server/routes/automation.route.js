const express = require("express");
const testRunController = require("../controllers/testRun.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.post("/runs", testRunController.startRun);
router.get("/runs", testRunController.listRuns);
router.get("/runs/:id", testRunController.getRun);
router.post("/runs/:id/stop", testRunController.stopRun);

module.exports = router;

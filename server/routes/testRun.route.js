const express = require("express");
const testRunController = require("../controllers/testRun.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.post("/runs", testRunController.startRun);
router.post("/run/start", testRunController.startRun);
router.get("/runs", testRunController.listRuns);
router.get("/runs/:id", testRunController.getRun);
router.post("/run", testRunController.runTests);
router.get("/results", testRunController.getResults);
router.get("/results/:runId", testRunController.getResults);
router.get("/result/:id", testRunController.getSingleResult);

module.exports = router;

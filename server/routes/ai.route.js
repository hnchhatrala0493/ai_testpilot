const express = require("express");
const aiController = require("../controllers/ai.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.post("/generate-test-cases", aiController.generateTestCases);

module.exports = router;

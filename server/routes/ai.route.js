const express = require("express");
const aiController = require("../controllers/ai.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.get("/modules", aiController.listModules);
router.get("/modules/:slug", aiController.getModule);
router.put("/modules/:slug", aiController.updateModule);
router.post("/modules/:slug/run", aiController.runModuleAction);
router.post("/generate-test-cases", aiController.generateTestCases);

module.exports = router;

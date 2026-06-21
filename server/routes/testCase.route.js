const express = require("express");
const testCaseController = require("../controllers/testCase.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.get("/", testCaseController.getTestCases);
router.get("/:id", testCaseController.getTestCaseById);
router.put("/:id", testCaseController.updateTestCase);
router.delete("/:id", testCaseController.deleteTestCase);

module.exports = router;

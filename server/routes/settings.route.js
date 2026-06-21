const express = require("express");
const settingsController = require("../controllers/settings.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);

module.exports = router;

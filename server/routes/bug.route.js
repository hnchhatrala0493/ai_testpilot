const express = require("express");
const bugController = require("../controllers/bug.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.post("/", bugController.createBug);
router.get("/", bugController.getBugs);
router.post("/:id/comments", bugController.addComment);
router.post("/:id/internal-notes", bugController.addInternalNote);
router.get("/:id", bugController.getBugById);
router.put("/:id", bugController.updateBug);
router.delete("/:id", bugController.deleteBug);

module.exports = router;

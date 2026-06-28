const express = require("express");
const projectController = require("../controllers/project.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.post("/", projectController.createProject);
router.get("/", projectController.getProjects);
router.get("/:id/repository-context", projectController.getProjectRepositoryContext);
router.get("/:id", projectController.getProjectById);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

module.exports = router;

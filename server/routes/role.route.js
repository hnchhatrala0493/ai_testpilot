const express = require("express");
const roleController = require("../controllers/role.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.post("/", roleController.createRole);
router.get("/", roleController.getRoles);
router.get("/permissions", roleController.getPermissions);
router.get("/:id", roleController.getRoleById);
router.put("/:id", roleController.updateRole);
router.put("/:id/permissions", roleController.updateRolePermissions);
router.delete("/:id", roleController.deleteRole);

module.exports = router;

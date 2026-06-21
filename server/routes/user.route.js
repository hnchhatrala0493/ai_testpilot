const express = require("express");
const userController = require("../controllers/user.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.post("/", userController.createUser);
router.get("/", userController.getAllUsers);
router.put("/:id/assign-role", userController.assignRole);
router.get("/:id", userController.getUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;

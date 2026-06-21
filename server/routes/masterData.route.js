const express = require("express");
const masterDataController = require("../controllers/masterData.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);

router.get("/types", masterDataController.getMasterDataTypes);

router.get("/roles", masterDataController.listRoles);
router.post("/roles", masterDataController.createRole);
router.put("/roles/:id", masterDataController.updateRole);
router.delete("/roles/:id", masterDataController.deleteRole);

router.get("/:type", masterDataController.listMasterData);
router.post("/:type", masterDataController.createMasterData);
router.put("/:type/:id", masterDataController.updateMasterData);
router.delete("/:type/:id", masterDataController.deleteMasterData);

module.exports = router;

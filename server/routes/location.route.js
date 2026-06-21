const express = require("express");
const locationController = require("../controllers/location.controller");
const { authRequired } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authRequired);
router.get("/countries", locationController.getCountries);
router.get("/states", locationController.getStates);
router.get("/cities", locationController.getCities);

module.exports = router;

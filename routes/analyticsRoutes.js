const express = require("express");
const authMiddelware = require("../middleware/authMiddleware");
const {
  bookGroupDetailsContoller,
} = require("../controllers/analyticsController");

const router = express.Router();

//routes

//GET BLOOD DATA
router.get("/bookGroups-data", authMiddelware, bookGroupDetailsContoller);

module.exports = router;
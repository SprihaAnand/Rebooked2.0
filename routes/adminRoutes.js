const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware"); 
const authMiddelware = require("../middleware/authMiddleware")
const {
  getDonarsListController,
  getInstituteListController,
  getOrgListController,
  deleteDonarController,
} = require("../controllers/adminController");

//router object
const router = express.Router();

//Routes

//GET || DONAR LIST
router.get(
  "/donar-list",
  authMiddelware,
  adminMiddleware,
  getDonarsListController
);
//GET || institute
router.get(
  "/institute-list",
  authMiddelware,
  adminMiddleware,
  getInstituteListController
);
//GET || ORG LIST
router.get("/org-list", authMiddelware, adminMiddleware, getOrgListController);
// ==========================

// DELETE DONAR || GET
router.delete(
  "/delete-donar/:id",
  authMiddelware,
  adminMiddleware,
  deleteDonarController
);

//EXPORT
module.exports = router;
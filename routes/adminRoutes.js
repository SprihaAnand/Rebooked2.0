const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { requireCsrf } = require("../middleware/authMiddleware");
const {
  getDonarsListController,
  getInstituteListController,
  getOrgListController,
  listUsersController,
  getAdminOverviewController,
  listDonationsController,
  updateUserStatusController,
  deleteDonarController,
} = require("../controllers/adminController");

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get("/overview", getAdminOverviewController);
router.get("/users", listUsersController);
router.get("/donations", listDonationsController);
router.patch("/users/:id/status", requireCsrf, updateUserStatusController);
router.get("/donar-list", getDonarsListController);
router.get("/institute-list", getInstituteListController);
router.get("/org-list", getOrgListController);
router.delete("/delete-donar/:id", requireCsrf, deleteDonarController);

module.exports = router;

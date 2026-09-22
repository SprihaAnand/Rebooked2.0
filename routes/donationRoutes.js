const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoles, requireCsrf } = require("../middleware/authMiddleware");
const { CANONICAL_ROLES } = require("../config/roles");
const {
  createDonationController,
  listDonationsController,
  getMyDonationsController,
  getDonationController,
  updateDonationController,
  withdrawDonationController,
} = require("../controllers/donationController");
const {
  acceptDonationController,
  getMyClaimsController,
  getIncomingClaimsController,
  updateClaimStatusController,
  collectClaimController,
  cancelClaimController,
} = require("../controllers/claimController");

const router = express.Router();

router.get("/", authMiddleware, listDonationsController);
router.get(
  "/mine",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR),
  getMyDonationsController
);

// Claim paths are deliberately registered before /:donationId. They match the
// contract used by the React app and keep claims scoped to the donation domain.
router.get(
  "/claims/mine",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.NGO, CANONICAL_ROLES.SCHOOL),
  getMyClaimsController
);
router.get(
  "/incoming-claims",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR),
  getIncomingClaimsController
);
router.patch(
  "/claims/:claimId",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR, CANONICAL_ROLES.NGO, CANONICAL_ROLES.SCHOOL),
  requireCsrf,
  updateClaimStatusController
);
router.patch(
  "/claims/:claimId/collect",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR),
  requireCsrf,
  collectClaimController
);
router.post(
  "/claims/:claimId/cancel",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR, CANONICAL_ROLES.NGO, CANONICAL_ROLES.SCHOOL),
  requireCsrf,
  cancelClaimController
);

router.post(
  "/",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR),
  requireCsrf,
  createDonationController
);
router.post(
  "/:donationId/claim",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.NGO, CANONICAL_ROLES.SCHOOL),
  requireCsrf,
  acceptDonationController
);
// A readable alias for API users that discovered the first implementation.
router.post(
  "/:donationId/accept",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.NGO, CANONICAL_ROLES.SCHOOL),
  requireCsrf,
  acceptDonationController
);
router.get("/:donationId", authMiddleware, getDonationController);
router.patch(
  "/:donationId",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR, CANONICAL_ROLES.ADMIN),
  requireCsrf,
  updateDonationController
);
router.delete(
  "/:donationId",
  authMiddleware,
  requireRoles(CANONICAL_ROLES.DONOR, CANONICAL_ROLES.ADMIN),
  requireCsrf,
  withdrawDonationController
);

module.exports = router;

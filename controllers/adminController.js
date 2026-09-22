const mongoose = require("mongoose");
const User = require("../models/userModel");
const Donation = require("../models/donationModel");
const Claim = require("../models/claimModel");
const Session = require("../models/sessionModel");
const { canonicalizeRole, roleValuesFor, toPublicUser, CANONICAL_ROLES } = require("../config/roles");
const { createNotification } = require("../utils/notifications");
const { serializeDonation } = require("./donationController");

function invalid(res, message, status = 400) {
  return res.status(status).send({ success: false, message });
}

function usersForRole(role) {
  return User.find({ role: { $in: roleValuesFor(role) } }).sort({ createdAt: -1 });
}

async function getDonarsListController(_req, res) {
  try {
    const users = await usersForRole(CANONICAL_ROLES.DONOR);
    return res.status(200).send({
      success: true,
      totalCount: users.length,
      donarData: users.map((user) => toPublicUser(user, { includeContact: true })),
    });
  } catch (error) {
    console.error("Donor list failed", error.message);
    return invalid(res, "Unable to load donor list", 500);
  }
}

async function getInstituteListController(_req, res) {
  try {
    const users = await usersForRole(CANONICAL_ROLES.SCHOOL);
    return res.status(200).send({
      success: true,
      totalCount: users.length,
      instituteData: users.map((user) => toPublicUser(user, { includeContact: true })),
    });
  } catch (error) {
    console.error("School list failed", error.message);
    return invalid(res, "Unable to load school list", 500);
  }
}

async function getOrgListController(_req, res) {
  try {
    const users = await usersForRole(CANONICAL_ROLES.NGO);
    return res.status(200).send({
      success: true,
      totalCount: users.length,
      orgData: users.map((user) => toPublicUser(user, { includeContact: true })),
    });
  } catch (error) {
    console.error("NGO list failed", error.message);
    return invalid(res, "Unable to load NGO list", 500);
  }
}

async function listUsersController(req, res) {
  try {
    const filters = {};
    if (req.query.role) {
      const role = canonicalizeRole(req.query.role);
      if (!role) return invalid(res, "Invalid role");
      filters.role = { $in: roleValuesFor(role) };
    }
    if (req.query.status) filters.status = req.query.status;
    const users = await User.find(filters).sort({ createdAt: -1 }).limit(200);
    return res.status(200).send({
      success: true,
      users: users.map((user) => toPublicUser(user, { includeContact: true })),
    });
  } catch (error) {
    console.error("User list failed", error.message);
    return invalid(res, "Unable to load users", 500);
  }
}

async function getAdminOverviewController(_req, res) {
  try {
    const [users, donationRows, openClaims, completedClaims] = await Promise.all([
      User.countDocuments(),
      Donation.aggregate([
        {
          $group: {
            _id: null,
            donations: { $sum: 1 },
            books: { $sum: "$quantityTotal" },
          },
        },
      ]),
      Claim.countDocuments({ status: { $in: ["accepted", "pickup_scheduled"] } }),
      Claim.countDocuments({ status: "collected" }),
    ]);

    const donationTotals = donationRows[0] || { donations: 0, books: 0 };
    return res.status(200).send({
      success: true,
      overview: {
        stats: {
          users,
          donations: donationTotals.donations,
          books: donationTotals.books,
          totalBooks: donationTotals.books,
          openClaims,
          completedClaims,
        },
      },
    });
  } catch (error) {
    console.error("Admin overview failed", error.message);
    return invalid(res, "Unable to load the admin overview", 500);
  }
}

async function listDonationsController(req, res) {
  try {
    const donations = await Donation.find()
      .populate("donor")
      .sort({ createdAt: -1 })
      .limit(250);
    return res.status(200).send({
      success: true,
      donations: donations.map((donation) =>
        serializeDonation(donation, req.auth.user, { includePickup: true })
      ),
    });
  } catch (error) {
    console.error("Admin donation list failed", error.message);
    return invalid(res, "Unable to load donations", 500);
  }
}

async function updateUserStatusController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return invalid(res, "Invalid user id");
    const status = req.body.status;
    if (!["active", "pending", "suspended"].includes(status)) {
      return invalid(res, "Status must be active, pending, or suspended");
    }
    if (String(req.params.id) === String(req.auth.user._id)) {
      return invalid(res, "Administrators cannot change their own account status", 409);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!user) return invalid(res, "User not found", 404);
    if (status === "suspended") {
      // A suspended account must not regain access through a still-valid
      // cookie if an administrator later reactivates it.
      await Session.updateMany(
        { user: user._id, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    await createNotification({
      recipient: user._id,
      type: "account_status",
      title: "Account status updated",
      message: `Your account is now ${status}.`,
      resourceType: "user",
      resourceId: user._id,
    });
    return res.status(200).send({
      success: true,
      message: "Account status updated",
      user: toPublicUser(user, { includeContact: true }),
    });
  } catch (error) {
    console.error("User status update failed", error.message);
    return invalid(res, "Unable to update account status", 500);
  }
}

// Kept for the existing admin screen. It now suspends rather than permanently
// deleting an account and its donation history.
async function deleteDonarController(req, res) {
  req.body = { ...(req.body || {}), status: "suspended" };
  return updateUserStatusController(req, res);
}

module.exports = {
  getDonarsListController,
  getInstituteListController,
  getOrgListController,
  listUsersController,
  getAdminOverviewController,
  listDonationsController,
  updateUserStatusController,
  deleteDonarController,
};

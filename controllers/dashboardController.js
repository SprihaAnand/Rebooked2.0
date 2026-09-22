const Donation = require("../models/donationModel");
const Claim = require("../models/claimModel");
const User = require("../models/userModel");
const { CANONICAL_ROLES, getUserRole } = require("../config/roles");
const { serializeDonation } = require("./donationController");
const { serializeClaim } = require("./claimController");

function zeroSummary() {
  return {
    donationCount: 0,
    totalBooks: 0,
    availableBooks: 0,
    claimedBooks: 0,
    collectedBooks: 0,
    activeClaims: 0,
  };
}

async function donorDashboard(user) {
  const donationIds = await Donation.find({ donor: user._id }).distinct("_id");
  const [summaryRows, claimRows, recentDonations, recentClaims] = await Promise.all([
    Donation.aggregate([
      { $match: { donor: user._id } },
      {
        $group: {
          _id: null,
          donationCount: { $sum: 1 },
          totalBooks: { $sum: "$quantityTotal" },
          availableBooks: { $sum: "$quantityAvailable" },
        },
      },
    ]),
    Claim.aggregate([
      { $match: { donation: { $in: donationIds } } },
      {
        $group: {
          _id: null,
          collectedBooks: {
            $sum: { $cond: [{ $eq: ["$status", "collected"] }, "$quantity", 0] },
          },
          activeClaims: {
            $sum: {
              $cond: [{ $in: ["$status", ["accepted", "pickup_scheduled"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    Donation.find({ donor: user._id }).populate("donor").sort({ createdAt: -1 }).limit(5),
    Claim.find({ donation: { $in: donationIds } })
      .populate({ path: "donation", populate: { path: "donor" } })
      .populate("recipient")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);
  const summary = { ...zeroSummary(), ...(summaryRows[0] || {}) };
  const claimSummary = claimRows[0] || {};
  summary.claimedBooks = summary.totalBooks - summary.availableBooks;
  summary.collectedBooks = claimSummary.collectedBooks || 0;
  summary.activeClaims = claimSummary.activeClaims || 0;
  return {
    summary,
    recentDonations: recentDonations.map((donation) => serializeDonation(donation, user, { includePickup: true })),
    recentClaims: recentClaims.map((claim) => serializeClaim(claim, user)),
  };
}

async function recipientDashboard(user) {
  const [claims, summaryRows] = await Promise.all([
    Claim.find({ recipient: user._id })
      .populate({ path: "donation", populate: { path: "donor" } })
      .populate("recipient")
      .sort({ createdAt: -1 })
      .limit(5),
    Claim.aggregate([
      { $match: { recipient: user._id } },
      {
        $group: {
          _id: null,
          claimedBooks: {
            $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, "$quantity", 0] },
          },
          collectedBooks: {
            $sum: { $cond: [{ $eq: ["$status", "collected"] }, "$quantity", 0] },
          },
          activeClaims: {
            $sum: {
              $cond: [{ $in: ["$status", ["accepted", "pickup_scheduled"]] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);
  const summary = { ...zeroSummary(), ...(summaryRows[0] || {}) };
  return { summary, recentClaims: claims.map((claim) => serializeClaim(claim, user)), recentDonations: [] };
}

async function adminDashboard(user) {
  const [donationRows, claimRows, userCounts, recentDonations, recentClaims] = await Promise.all([
    Donation.aggregate([
      {
        $group: {
          _id: null,
          donationCount: { $sum: 1 },
          totalBooks: { $sum: "$quantityTotal" },
          availableBooks: { $sum: "$quantityAvailable" },
        },
      },
    ]),
    Claim.aggregate([
      {
        $group: {
          _id: null,
          collectedBooks: {
            $sum: { $cond: [{ $eq: ["$status", "collected"] }, "$quantity", 0] },
          },
          activeClaims: {
            $sum: {
              $cond: [{ $in: ["$status", ["accepted", "pickup_scheduled"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Donation.find().populate("donor").sort({ createdAt: -1 }).limit(5),
    Claim.find().populate({ path: "donation", populate: { path: "donor" } }).populate("recipient").sort({ createdAt: -1 }).limit(5),
  ]);
  const summary = { ...zeroSummary(), ...(donationRows[0] || {}) };
  const claimSummary = claimRows[0] || {};
  summary.claimedBooks = summary.totalBooks - summary.availableBooks;
  summary.collectedBooks = claimSummary.collectedBooks || 0;
  summary.activeClaims = claimSummary.activeClaims || 0;
  return {
    summary,
    userCounts: userCounts.reduce((counts, row) => ({ ...counts, [row._id]: row.count }), {}),
    recentDonations: recentDonations.map((donation) => serializeDonation(donation, user, { includePickup: true })),
    recentClaims: recentClaims.map((claim) => serializeClaim(claim, user)),
  };
}

async function dashboardController(req, res) {
  try {
    const role = getUserRole(req.auth.user);
    let dashboard;
    if (role === CANONICAL_ROLES.DONOR) dashboard = await donorDashboard(req.auth.user);
    else if ([CANONICAL_ROLES.NGO, CANONICAL_ROLES.SCHOOL].includes(role)) {
      dashboard = await recipientDashboard(req.auth.user);
    } else if (role === CANONICAL_ROLES.ADMIN) {
      dashboard = await adminDashboard(req.auth.user);
    } else {
      return res.status(403).send({ success: false, message: "A valid account role is required" });
    }

    return res.status(200).send({ success: true, role, ...dashboard });
  } catch (error) {
    console.error("Dashboard failed", error.message);
    return res.status(500).send({ success: false, message: "Unable to load dashboard" });
  }
}

module.exports = { dashboardController };

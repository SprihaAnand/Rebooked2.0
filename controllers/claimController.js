const mongoose = require("mongoose");
const Donation = require("../models/donationModel");
const Claim = require("../models/claimModel");
const { CANONICAL_ROLES, getUserRole, toPublicUser } = require("../config/roles");
const { positiveInteger, cleanText } = require("../utils/validation");
const { createNotification } = require("../utils/notifications");
const { serializeDonation } = require("./donationController");

const ACTIVE_CLAIM_STATUSES = ["accepted", "pickup_scheduled"];

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function invalid(res, message, status = 400) {
  return res.status(status).send({ success: false, message });
}

function isTransactionUnsupported(error) {
  return /Transaction numbers are only allowed|does not support transactions|replica set/i.test(
    String(error?.message || "")
  );
}

function reserveQuantityPipeline(quantity) {
  return [
    {
      $set: {
        quantityAvailable: { $subtract: ["$quantityAvailable", quantity] },
        status: {
          $let: {
            vars: {
              remaining: { $subtract: ["$quantityAvailable", quantity] },
            },
            in: {
              $cond: [
                { $lte: ["$$remaining", 0] },
                "claimed",
                {
                  $cond: [
                    { $lt: ["$$remaining", "$quantityTotal"] },
                    "partially_claimed",
                    "available",
                  ],
                },
              ],
            },
          },
        },
        // Mongoose's optimistic concurrency relies on this version changing
        // whenever stock changes, including on standalone MongoDB fallback.
        __v: { $add: [{ $ifNull: ["$__v", 0] }, 1] },
      },
    },
  ];
}

function restoreQuantityPipeline(quantity) {
  return [
    {
      $set: {
        quantityAvailable: {
          $min: ["$quantityTotal", { $add: ["$quantityAvailable", quantity] }],
        },
        status: {
          $let: {
            vars: {
              restored: {
                $min: ["$quantityTotal", { $add: ["$quantityAvailable", quantity] }],
              },
            },
            in: {
              $cond: [
                { $lte: ["$$restored", 0] },
                "claimed",
                {
                  $cond: [
                    { $lt: ["$$restored", "$quantityTotal"] },
                    "partially_claimed",
                    "available",
                  ],
                },
              ],
            },
          },
        },
        __v: { $add: [{ $ifNull: ["$__v", 0] }, 1] },
      },
    },
  ];
}

async function restoreDonationAvailability(donationId, quantity) {
  return Donation.findOneAndUpdate(
    { _id: donationId, status: { $ne: "withdrawn" } },
    restoreQuantityPipeline(quantity),
    { new: true }
  );
}

function isDonationOwner(donation, userId) {
  return String(donation.donor?._id || donation.donor) === String(userId);
}

function serializeClaim(claim, viewer) {
  const source = typeof claim.toObject === "function" ? claim.toObject() : claim;
  const isRecipient = String(source.recipient?._id || source.recipient) === String(viewer._id);
  const isDonor = isDonationOwner(source.donation, viewer._id);

  return {
    _id: source._id,
    id: String(source._id),
    quantity: source.quantity,
    status: source.status,
    note: source.note,
    scheduledFor: source.scheduledFor,
    acceptedAt: source.acceptedAt,
    collectedAt: source.collectedAt,
    cancelledAt: source.cancelledAt,
    cancelReason: source.cancelReason,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    donation: source.donation?.title
      ? serializeDonation(source.donation, viewer, { includePickup: isRecipient || isDonor })
      : source.donation,
    recipient: source.recipient?.email
      ? toPublicUser(source.recipient, { includeContact: isDonor })
      : source.recipient,
  };
}

async function createOrReactivateClaim(
  { donationId, recipientId, quantity, note, existingClaimId },
  { session } = {}
) {
  if (existingClaimId) {
    const options = { new: true };
    if (session) options.session = session;
    const claim = await Claim.findOneAndUpdate(
      {
        _id: existingClaimId,
        donation: donationId,
        recipient: recipientId,
        status: "cancelled",
      },
      {
        $set: {
          quantity,
          note,
          status: "accepted",
          acceptedAt: new Date(),
        },
        $unset: {
          scheduledFor: 1,
          collectedAt: 1,
          cancelledAt: 1,
          cancelReason: 1,
        },
      },
      options
    );
    if (!claim) {
      throw new ApiError("This claim changed while you were accepting books", 409);
    }
    return claim;
  }

  const documents = await Claim.create(
    [
      {
        donation: donationId,
        recipient: recipientId,
        quantity,
        note,
        status: "accepted",
      },
    ],
    session ? { session } : undefined
  );
  return documents[0];
}

async function reserveDonationInTransaction({ donationId, recipientId, quantity, note, existingClaimId }) {
  const dbSession = await mongoose.startSession();
  let result;
  try {
    await dbSession.withTransaction(async () => {
      const donation = await Donation.findOneAndUpdate(
        {
          _id: donationId,
          status: { $in: ["available", "partially_claimed"] },
          quantityAvailable: { $gte: quantity },
        },
        reserveQuantityPipeline(quantity),
        { new: true, session: dbSession }
      );
      if (!donation) throw new ApiError("This donation no longer has that quantity available", 409);
      if (isDonationOwner(donation, recipientId)) {
        throw new ApiError("You cannot accept your own donation", 403);
      }

      const claim = await createOrReactivateClaim(
        {
          donationId: donation._id,
          recipientId,
          quantity,
          note,
          existingClaimId,
        },
        { session: dbSession }
      );
      result = { donation, claim };
    });
    return result;
  } finally {
    await dbSession.endSession();
  }
}

// Atlas and replica-set MongoDB deployments use the transactional path above.
// This compensating fallback keeps local single-node MongoDB usable without
// allowing concurrent acceptances to over-reserve inventory.
async function reserveDonationFallback({ donationId, recipientId, quantity, note, existingClaimId }) {
  const donation = await Donation.findOneAndUpdate(
    {
      _id: donationId,
      status: { $in: ["available", "partially_claimed"] },
      quantityAvailable: { $gte: quantity },
      donor: { $ne: recipientId },
    },
    reserveQuantityPipeline(quantity),
    { new: true }
  );
  if (!donation) throw new ApiError("This donation no longer has that quantity available", 409);

  try {
    const claim = await createOrReactivateClaim({
      donationId: donation._id,
      recipientId,
      quantity,
      note,
      existingClaimId,
    });
    return { donation, claim };
  } catch (error) {
    // The conditional decrement is compensated if creating the claim fails.
    await restoreDonationAvailability(donation._id, quantity);
    throw error;
  }
}

async function acceptDonationController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.donationId)) {
      return invalid(res, "Invalid donation id");
    }
    const quantity = positiveInteger(req.body.quantity);
    if (!quantity) return invalid(res, "Quantity must be a whole number between 1 and 10,000");

    const existingClaim = await Claim.findOne({
      donation: req.params.donationId,
      recipient: req.auth.user._id,
    });
    if (existingClaim && existingClaim.status !== "cancelled") {
      return invalid(res, "Your organization has already accepted this donation", 409);
    }

    const input = {
      donationId: req.params.donationId,
      recipientId: req.auth.user._id,
      quantity,
      note: cleanText(req.body.note, 1000) || undefined,
      existingClaimId: existingClaim?._id,
    };

    let result;
    try {
      result = await reserveDonationInTransaction(input);
    } catch (error) {
      if (!isTransactionUnsupported(error)) throw error;
      result = await reserveDonationFallback(input);
    }

    const populatedClaim = await Claim.findById(result.claim._id)
      .populate({ path: "donation", populate: { path: "donor" } })
      .populate("recipient");
    const donorId = populatedClaim.donation.donor._id;
    await createNotification({
      recipient: donorId,
      type: "claim_accepted",
      title: "Your donation was accepted",
      message: `${req.auth.user.name || req.auth.user.organizationName || req.auth.user.schoolName || "A recipient"} accepted ${quantity} book${quantity === 1 ? "" : "s"}.`,
      resourceType: "claim",
      resourceId: populatedClaim._id,
    });
    await createNotification({
      recipient: req.auth.user._id,
      type: "claim_accepted",
      title: "Books reserved",
      message: `You accepted ${quantity} book${quantity === 1 ? "" : "s"} from ${populatedClaim.donation.title}.`,
      resourceType: "claim",
      resourceId: populatedClaim._id,
    });

    return res.status(201).send({
      success: true,
      message: "Books accepted and reserved for your organization",
      claim: serializeClaim(populatedClaim, req.auth.user),
    });
  } catch (error) {
    if (error instanceof ApiError) return invalid(res, error.message, error.status);
    if (error?.code === 11000) {
      return invalid(res, "Your organization has already accepted this donation", 409);
    }
    console.error("Donation acceptance failed", error.message);
    return invalid(res, "Unable to accept the donation", 500);
  }
}

async function getMyClaimsController(req, res) {
  try {
    const claims = await Claim.find({ recipient: req.auth.user._id })
      .populate({ path: "donation", populate: { path: "donor" } })
      .populate("recipient")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      claims: claims.map((claim) => serializeClaim(claim, req.auth.user)),
    });
  } catch (error) {
    console.error("Claim list failed", error.message);
    return invalid(res, "Unable to load accepted books", 500);
  }
}

async function getIncomingClaimsController(req, res) {
  try {
    const donationIds = await Donation.find({ donor: req.auth.user._id }).distinct("_id");
    const claims = await Claim.find({ donation: { $in: donationIds } })
      .populate({ path: "donation", populate: { path: "donor" } })
      .populate("recipient")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      claims: claims.map((claim) => serializeClaim(claim, req.auth.user)),
    });
  } catch (error) {
    console.error("Incoming claims failed", error.message);
    return invalid(res, "Unable to load claims for your donations", 500);
  }
}

async function cancelClaim({ claimId, actorId, reason }) {
  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      const claim = await Claim.findOne({
        _id: claimId,
        status: { $in: ACTIVE_CLAIM_STATUSES },
      }).session(dbSession);
      if (!claim) throw new ApiError("This claim can no longer be cancelled", 409);

      const donation = await Donation.findById(claim.donation).session(dbSession);
      if (!donation) throw new ApiError("Donation not found", 404);
      if (
        String(claim.recipient) !== String(actorId) &&
        !isDonationOwner(donation, actorId)
      ) {
        throw new ApiError("You do not have permission to update this claim", 403);
      }

      claim.status = "cancelled";
      claim.cancelledAt = new Date();
      claim.cancelReason = reason;
      await claim.save({ session: dbSession });

      const restoredDonation = await Donation.findOneAndUpdate(
        { _id: donation._id, status: { $ne: "withdrawn" } },
        restoreQuantityPipeline(claim.quantity),
        { new: true, session: dbSession }
      );
      if (!restoredDonation) throw new ApiError("Donation is no longer available", 409);
      result = { claim, donation: restoredDonation };
    });
    return result;
  } finally {
    await dbSession.endSession();
  }
}

async function cancelClaimFallback({ claimId, actorId, reason }) {
  // Standalone MongoDB cannot use multi-document transactions.  Verify the
  // actor before changing anything, then use the originally observed status
  // as a compare-and-set guard.  This avoids an unauthorized cancellation
  // temporarily changing (or downgrading) someone else's pickup-scheduled
  // claim while still remaining safe under concurrent updates.
  const existingClaim = await Claim.findOne({
    _id: claimId,
    status: { $in: ACTIVE_CLAIM_STATUSES },
  });
  if (!existingClaim) throw new ApiError("This claim can no longer be cancelled", 409);

  const donation = await Donation.findById(existingClaim.donation);
  if (!donation) throw new ApiError("Donation not found", 404);
  if (
    String(existingClaim.recipient) !== String(actorId) &&
    !isDonationOwner(donation, actorId)
  ) {
    throw new ApiError("You do not have permission to update this claim", 403);
  }

  const claim = await Claim.findOneAndUpdate(
    { _id: existingClaim._id, status: existingClaim.status },
    { $set: { status: "cancelled", cancelledAt: new Date(), cancelReason: reason } },
    { new: true }
  );
  if (!claim) throw new ApiError("This claim changed while you were cancelling it", 409);

  const restoredDonation = await restoreDonationAvailability(donation._id, claim.quantity);
  return { claim, donation: restoredDonation || donation };
}

async function updateClaimStatusController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.claimId)) return invalid(res, "Invalid claim id");
    const status = cleanText(req.body.status, 40);
    if (!["pickup_scheduled", "collected", "cancelled"].includes(status)) {
      return invalid(res, "Provide pickup_scheduled, collected, or cancelled as the status");
    }

    if (status === "cancelled") {
      const reason = cleanText(req.body.cancelReason, 500) || undefined;
      let result;
      try {
        result = await cancelClaim({ claimId: req.params.claimId, actorId: req.auth.user._id, reason });
      } catch (error) {
        if (!isTransactionUnsupported(error)) throw error;
        result = await cancelClaimFallback({ claimId: req.params.claimId, actorId: req.auth.user._id, reason });
      }
      const claim = await Claim.findById(result.claim._id)
        .populate({ path: "donation", populate: { path: "donor" } })
        .populate("recipient");
      const otherParty = isDonationOwner(claim.donation, req.auth.user._id)
        ? claim.recipient._id
        : claim.donation.donor._id;
      await createNotification({
        recipient: otherParty,
        type: "claim_cancelled",
        title: "A book claim was cancelled",
        message: `The claim for ${claim.donation.title} was cancelled.`,
        resourceType: "claim",
        resourceId: claim._id,
      });
      return res.status(200).send({
        success: true,
        message: "Claim cancelled and book quantity restored",
        claim: serializeClaim(claim, req.auth.user),
      });
    }

    const claim = await Claim.findById(req.params.claimId)
      .populate({ path: "donation", populate: { path: "donor" } })
      .populate("recipient");
    if (!claim) return invalid(res, "Claim not found", 404);
    const isRecipient = String(claim.recipient._id) === String(req.auth.user._id);
    const isDonor = isDonationOwner(claim.donation, req.auth.user._id);
    if (!isRecipient && !isDonor) {
      return invalid(res, "You do not have permission to update this claim", 403);
    }
    if (!ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
      return invalid(res, "This claim can no longer be updated", 409);
    }
    if (status === "collected" && !isDonor) {
      return invalid(res, "Only the donor can confirm collection", 403);
    }

    if (status === "pickup_scheduled") {
      if (req.body.scheduledFor) {
        const scheduledFor = new Date(req.body.scheduledFor);
        if (Number.isNaN(scheduledFor.getTime())) return invalid(res, "Provide a valid pickup time");
        claim.scheduledFor = scheduledFor;
      }
      claim.note = cleanText(req.body.note, 1000) || claim.note;
    }
    claim.status = status;
    if (status === "collected") claim.collectedAt = new Date();
    await claim.save();

    const otherParty = isDonor ? claim.recipient._id : claim.donation.donor._id;
    await createNotification({
      recipient: otherParty,
      type: status === "collected" ? "claim_collected" : "claim_scheduled",
      title: status === "collected" ? "Book collection confirmed" : "Pickup scheduled",
      message: status === "collected"
        ? `Collection of ${claim.donation.title} was confirmed.`
        : `Pickup for ${claim.donation.title} was scheduled.`,
      resourceType: "claim",
      resourceId: claim._id,
    });
    return res.status(200).send({
      success: true,
      message: status === "collected" ? "Collection confirmed" : "Pickup scheduled",
      claim: serializeClaim(claim, req.auth.user),
    });
  } catch (error) {
    if (error instanceof ApiError) return invalid(res, error.message, error.status);
    if (error?.name === "VersionError") {
      return invalid(res, "This claim changed while you were updating it. Refresh and try again.", 409);
    }
    console.error("Claim update failed", error.message);
    return invalid(res, "Unable to update claim", 500);
  }
}

async function collectClaimController(req, res) {
  req.body = { ...(req.body || {}), status: "collected" };
  return updateClaimStatusController(req, res);
}

async function cancelClaimController(req, res) {
  req.body = { ...(req.body || {}), status: "cancelled" };
  return updateClaimStatusController(req, res);
}

module.exports = {
  acceptDonationController,
  getMyClaimsController,
  getIncomingClaimsController,
  updateClaimStatusController,
  collectClaimController,
  cancelClaimController,
  serializeClaim,
};

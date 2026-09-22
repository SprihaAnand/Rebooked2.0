const mongoose = require("mongoose");
const Donation = require("../models/donationModel");
const Claim = require("../models/claimModel");
const {
  CANONICAL_ROLES,
  getUserRole,
  toPublicUser,
} = require("../config/roles");
const {
  cleanText,
  normalizeCategory,
  positiveInteger,
} = require("../utils/validation");

const DONATION_STATUSES_VISIBLE_TO_RECIPIENTS = ["available", "partially_claimed"];
const CONDITIONS = ["new", "like_new", "good", "fair", "well_loved"];

function invalid(res, message, status = 400) {
  return res.status(status).send({ success: false, message });
}

function isOwnerOrAdmin(donation, user) {
  return (
    String(donation.donor?._id || donation.donor) === String(user._id) ||
    getUserRole(user) === CANONICAL_ROLES.ADMIN
  );
}

function serializeDonation(donation, viewer, { includePickup = false } = {}) {
  const source = typeof donation.toObject === "function" ? donation.toObject() : donation;
  const canSeePickup = includePickup || isOwnerOrAdmin(source, viewer);
  const donor = source.donor?._id
    ? toPublicUser(source.donor, { includeContact: canSeePickup })
    : undefined;

  return {
    _id: source._id,
    id: String(source._id),
    title: source.title,
    author: source.author,
    isbn: source.isbn,
    category: source.category,
    condition: source.condition,
    language: source.language,
    description: source.description,
    quantityTotal: source.quantityTotal,
    quantityAvailable: source.quantityAvailable,
    // Frontend-friendly aliases retained alongside the explicit canonical
    // fields so API consumers can evolve without a breaking release.
    availableQuantity: source.quantityAvailable,
    quantityClaimed: source.quantityTotal - source.quantityAvailable,
    status: source.status,
    imageUrls: source.imageUrls || [],
    imageUrl: source.imageUrls?.[0],
    publishedAt: source.publishedAt,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    donor,
    pickup: canSeePickup
      ? source.pickup
      : {
          city: source.pickup?.city,
          state: source.pickup?.state,
        },
    pickupCity: source.pickup?.city,
    pickupAddress: canSeePickup ? source.pickup?.address : undefined,
    pickupInstructions: canSeePickup ? source.pickup?.instructions : undefined,
  };
}

function buildPickup(body, existing = {}) {
  const source = body.pickup && typeof body.pickup === "object" ? body.pickup : {};
  return {
    address: cleanText(source.address ?? body.pickupAddress ?? existing.address, 300),
    city: cleanText(source.city ?? body.pickupCity ?? body.city ?? existing.city, 100),
    state: cleanText(source.state ?? body.state ?? existing.state, 100),
    postalCode: cleanText(source.postalCode ?? body.postalCode ?? existing.postalCode, 20),
    instructions: cleanText(source.instructions ?? body.pickupInstructions ?? existing.instructions, 1000),
  };
}

function buildDonationFields(body, { existing } = {}) {
  const title = cleanText(body.title ?? body.bookTitle ?? existing?.title, 180);
  const category = normalizeCategory(body.category ?? body.bookGroup ?? existing?.category);
  const condition = cleanText(body.condition ?? existing?.condition, 40) || "good";
  const pickup = buildPickup(body, existing?.pickup);
  const rawImageUrls = body.imageUrls === undefined
    ? body.imageUrl === undefined
      ? existing?.imageUrls || []
      : [body.imageUrl]
    : body.imageUrls;
  const imageUrls = Array.isArray(rawImageUrls)
    ? rawImageUrls
        .filter((url) => typeof url === "string" && /^https:\/\//i.test(url.trim()))
        .slice(0, 5)
        .map((url) => url.trim().slice(0, 2048))
    : [];

  if (!title) return { error: "A book title is required" };
  if (!CONDITIONS.includes(condition)) return { error: "Provide a valid book condition" };
  if (!pickup.address || !pickup.city) {
    return { error: "A pickup address and city are required" };
  }

  return {
    value: {
      title,
      author: cleanText(body.author ?? existing?.author, 180) || undefined,
      isbn: cleanText(body.isbn ?? existing?.isbn, 32) || undefined,
      category,
      condition,
      language: cleanText(body.language ?? existing?.language, 80) || "English",
      description: cleanText(body.description ?? existing?.description, 2000) || undefined,
      pickup,
      imageUrls,
    },
  };
}

function pagination(query) {
  const page = positiveInteger(query.page, { min: 1, max: 100000 }) || 1;
  const limit = positiveInteger(query.limit, { min: 1, max: 50 }) || 12;
  return { page, limit, skip: (page - 1) * limit };
}

function escapedRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createDonationController(req, res) {
  try {
    const quantity = positiveInteger(req.body.quantityTotal ?? req.body.quantity);
    if (!quantity) return invalid(res, "Quantity must be a whole number between 1 and 10,000");

    const fields = buildDonationFields(req.body);
    if (fields.error) return invalid(res, fields.error);

    const donation = await Donation.create({
      ...fields.value,
      donor: req.auth.user._id,
      quantityTotal: quantity,
      quantityAvailable: quantity,
      status: "available",
    });
    await donation.populate("donor");

    return res.status(201).send({
      success: true,
      message: "Donation published",
      donation: serializeDonation(donation, req.auth.user, { includePickup: true }),
    });
  } catch (error) {
    console.error("Donation creation failed", error.message);
    return invalid(res, "Unable to publish the donation", 500);
  }
}

async function listDonationsController(req, res) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const filters = { status: { $in: DONATION_STATUSES_VISIBLE_TO_RECIPIENTS } };
    const role = getUserRole(req.auth.user);

    if (role === CANONICAL_ROLES.ADMIN && req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.category) filters.category = normalizeCategory(req.query.category);
    if (req.query.condition && CONDITIONS.includes(req.query.condition)) {
      filters.condition = req.query.condition;
    }
    const searchTerm = req.query.search || req.query.q;
    if (searchTerm && typeof searchTerm === "string") {
      const search = new RegExp(escapedRegex(searchTerm.trim()), "i");
      filters.$or = [{ title: search }, { author: search }, { description: search }];
    }

    const [donations, total] = await Promise.all([
      Donation.find(filters)
        .populate("donor")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donation.countDocuments(filters),
    ]);

    return res.status(200).send({
      success: true,
      donations: donations.map((donation) => serializeDonation(donation, req.auth.user)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Donation list failed", error.message);
    return invalid(res, "Unable to load donations", 500);
  }
}

async function getMyDonationsController(req, res) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const filters = { donor: req.auth.user._id };
    if (req.query.status) filters.status = req.query.status;
    const [donations, total] = await Promise.all([
      Donation.find(filters)
        .populate("donor")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donation.countDocuments(filters),
    ]);

    return res.status(200).send({
      success: true,
      donations: donations.map((donation) =>
        serializeDonation(donation, req.auth.user, { includePickup: true })
      ),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("My donations failed", error.message);
    return invalid(res, "Unable to load your donations", 500);
  }
}

async function getDonationController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.donationId)) {
      return invalid(res, "Invalid donation id");
    }
    const donation = await Donation.findById(req.params.donationId).populate("donor");
    if (!donation) return invalid(res, "Donation not found", 404);
    if (donation.status === "withdrawn" && !isOwnerOrAdmin(donation, req.auth.user)) {
      return invalid(res, "Donation not found", 404);
    }
    return res.status(200).send({
      success: true,
      donation: serializeDonation(donation, req.auth.user),
    });
  } catch (error) {
    console.error("Donation lookup failed", error.message);
    return invalid(res, "Unable to load donation", 500);
  }
}

async function updateDonationController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.donationId)) {
      return invalid(res, "Invalid donation id");
    }
    const donation = await Donation.findById(req.params.donationId).populate("donor");
    if (!donation) return invalid(res, "Donation not found", 404);
    if (!isOwnerOrAdmin(donation, req.auth.user)) {
      return invalid(res, "You can only edit your own donations", 403);
    }
    if (donation.status === "withdrawn" || donation.status === "claimed") {
      return invalid(res, "This donation can no longer be edited", 409);
    }

    const fields = buildDonationFields(req.body, { existing: donation });
    if (fields.error) return invalid(res, fields.error);

    if (req.body.quantityTotal !== undefined || req.body.quantity !== undefined) {
      const totalQuantity = positiveInteger(req.body.quantityTotal ?? req.body.quantity);
      if (!totalQuantity) return invalid(res, "Quantity must be a whole number between 1 and 10,000");
      const claimed = donation.quantityTotal - donation.quantityAvailable;
      if (totalQuantity < claimed) {
        return invalid(res, "Quantity cannot be lower than the quantity already claimed", 409);
      }
      donation.quantityTotal = totalQuantity;
      donation.quantityAvailable = totalQuantity - claimed;
      donation.status = donation.quantityAvailable === 0
        ? "claimed"
        : claimed > 0
          ? "partially_claimed"
          : "available";
    }

    Object.assign(donation, fields.value);
    await donation.save();
    return res.status(200).send({
      success: true,
      message: "Donation updated",
      donation: serializeDonation(donation, req.auth.user, { includePickup: true }),
    });
  } catch (error) {
    if (error?.name === "VersionError") {
      return invalid(res, "This donation changed while you were editing it. Refresh and try again.", 409);
    }
    console.error("Donation update failed", error.message);
    return invalid(res, "Unable to update donation", 500);
  }
}

async function withdrawDonationController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.donationId)) {
      return invalid(res, "Invalid donation id");
    }
    const donation = await Donation.findById(req.params.donationId).populate("donor");
    if (!donation) return invalid(res, "Donation not found", 404);
    if (!isOwnerOrAdmin(donation, req.auth.user)) {
      return invalid(res, "You can only withdraw your own donations", 403);
    }
    const activeClaims = await Claim.exists({
      donation: donation._id,
      status: { $in: ["accepted", "pickup_scheduled"] },
    });
    if (activeClaims) {
      return invalid(res, "Cancel active claims before withdrawing this donation", 409);
    }
    donation.status = "withdrawn";
    await donation.save();
    return res.status(200).send({ success: true, message: "Donation withdrawn" });
  } catch (error) {
    if (error?.name === "VersionError") {
      return invalid(res, "This donation changed while you were withdrawing it. Refresh and try again.", 409);
    }
    console.error("Donation withdrawal failed", error.message);
    return invalid(res, "Unable to withdraw donation", 500);
  }
}

module.exports = {
  createDonationController,
  listDonationsController,
  getMyDonationsController,
  getDonationController,
  updateDonationController,
  withdrawDonationController,
  serializeDonation,
};

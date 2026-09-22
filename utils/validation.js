const { canonicalizeRole, CANONICAL_ROLES } = require("../config/roles");
const { BOOK_CATEGORIES } = require("../models/donationModel");

const CATEGORY_ALIASES = Object.freeze({
  elementry: "Elementary",
  elementary: "Elementary",
  jee: "JEE",
  neet: "NEET",
  novels: "Novels",
  architecture: "Architecture",
  history: "History",
  kids: "Kids",
  autobiographies: "Autobiographies",
  academic: "Academic",
  other: "Other",
});

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

function cleanText(value, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function positiveInteger(value, { min = 1, max = 10000 } = {}) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function normalizeCategory(value) {
  if (typeof value !== "string") return "Other";
  const normalized = CATEGORY_ALIASES[value.trim().toLowerCase()] || value.trim();
  return BOOK_CATEGORIES.includes(normalized) ? normalized : "Other";
}

function normalizeRegistrationRole(value) {
  const role = canonicalizeRole(value);
  return role === CANONICAL_ROLES.ADMIN ? null : role;
}

module.exports = {
  normalizeEmail,
  isValidEmail,
  cleanText,
  positiveInteger,
  normalizeCategory,
  normalizeRegistrationRole,
};

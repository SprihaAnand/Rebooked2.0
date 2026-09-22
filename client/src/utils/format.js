export const BOOK_CATEGORIES = [
  "Elementary",
  "JEE",
  "NEET",
  "Novels",
  "Architecture",
  "History",
  "Kids",
  "Autobiographies",
  "Academic",
  "Other",
];

export const BOOK_CONDITIONS = ["new", "like_new", "good", "fair", "well_loved"];
export const RECIPIENT_ROLES = ["ngo", "school"];

export const humanize = (value = "") =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const displayRole = (role) => (role === "ngo" ? "NGO" : humanize(role));

export const formatDate = (value, options = {}) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
};

export const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value || 0));
export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${formatNumber(count)} ${Number(count) === 1 ? singular : plural}`;

export const listFrom = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return Array.isArray(data) ? data : [];
};

export const availableQuantity = (donation) => {
  const raw =
    donation?.availableQuantity ??
    donation?.quantityAvailable ??
    donation?.remainingQuantity ??
    donation?.available ??
    donation?.quantity ??
    0;
  return Math.max(Number(raw) || 0, 0);
};

export const donationOwnerName = (donation) => {
  const donor = donation?.donor || donation?.owner;
  return donor?.name || donation?.donorName || "A Rebooked donor";
};

export const recipientName = (claim) => {
  const recipient = claim?.recipient || claim?.organisation || claim?.organization;
  return (
    recipient?.name ||
    recipient?.organisationName ||
    recipient?.organizationName ||
    recipient?.schoolName ||
    claim?.recipientName ||
    "Recipient"
  );
};

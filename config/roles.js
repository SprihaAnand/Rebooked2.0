const CANONICAL_ROLES = Object.freeze({
  DONOR: "donor",
  NGO: "ngo",
  SCHOOL: "school",
  ADMIN: "admin",
});

// The original application persisted misspelled/legacy role names.  Keep them
// readable while all new API authorization works with the canonical values.
const ROLE_ALIASES = Object.freeze({
  donor: CANONICAL_ROLES.DONOR,
  donar: CANONICAL_ROLES.DONOR,
  ngo: CANONICAL_ROLES.NGO,
  organisation: CANONICAL_ROLES.NGO,
  organization: CANONICAL_ROLES.NGO,
  school: CANONICAL_ROLES.SCHOOL,
  institute: CANONICAL_ROLES.SCHOOL,
  admin: CANONICAL_ROLES.ADMIN,
});

const REGISTRABLE_ROLES = Object.freeze([
  CANONICAL_ROLES.DONOR,
  CANONICAL_ROLES.NGO,
  CANONICAL_ROLES.SCHOOL,
]);

function canonicalizeRole(value) {
  if (typeof value !== "string") return null;
  return ROLE_ALIASES[value.trim().toLowerCase()] || null;
}

function roleValuesFor(canonicalRole) {
  return Object.keys(ROLE_ALIASES).filter(
    (value) => ROLE_ALIASES[value] === canonicalRole
  );
}

function getUserRole(user) {
  return canonicalizeRole(user?.role);
}

function getDisplayName(user) {
  return (
    user?.name ||
    user?.organizationName ||
    user?.organisationName ||
    user?.schoolName ||
    user?.instituteName ||
    user?.email ||
    "User"
  );
}

function toPublicUser(user, { includeContact = false } = {}) {
  if (!user) return null;
  const source = typeof user.toObject === "function" ? user.toObject() : user;
  const result = {
    _id: source._id,
    id: String(source._id),
    role: canonicalizeRole(source.role),
    name: source.name,
    organizationName: source.organizationName || source.organisationName,
    schoolName: source.schoolName || source.instituteName,
    displayName: getDisplayName(source),
    website: source.website,
    status: source.status || "active",
    avatarUrl: source.avatarUrl,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };

  if (includeContact) {
    result.email = source.email;
    result.address = source.address;
    result.phone = source.phone;
  }

  return result;
}

module.exports = {
  CANONICAL_ROLES,
  ROLE_ALIASES,
  REGISTRABLE_ROLES,
  canonicalizeRole,
  roleValuesFor,
  getUserRole,
  getDisplayName,
  toPublicUser,
};

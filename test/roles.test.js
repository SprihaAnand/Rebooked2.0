const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CANONICAL_ROLES,
  canonicalizeRole,
  getDisplayName,
  toPublicUser,
} = require("../config/roles");

test("legacy account roles resolve to the canonical product roles", () => {
  assert.equal(canonicalizeRole("donar"), CANONICAL_ROLES.DONOR);
  assert.equal(canonicalizeRole("organisation"), CANONICAL_ROLES.NGO);
  assert.equal(canonicalizeRole("institute"), CANONICAL_ROLES.SCHOOL);
  assert.equal(canonicalizeRole("admin"), CANONICAL_ROLES.ADMIN);
  assert.equal(canonicalizeRole("unknown"), null);
});

test("public user serialization hides contact data until it is explicitly needed", () => {
  const user = {
    _id: "user-123",
    role: "donar",
    name: "Asha Sharma",
    email: "asha@example.test",
    phone: "1234567890",
    address: "Private address",
  };

  const publicUser = toPublicUser(user);
  assert.equal(publicUser.displayName, "Asha Sharma");
  assert.equal(publicUser.email, undefined);
  assert.equal(publicUser.phone, undefined);
  assert.equal(publicUser.address, undefined);

  const claimContact = toPublicUser(user, { includeContact: true });
  assert.equal(claimContact.email, "asha@example.test");
  assert.equal(claimContact.phone, "1234567890");
  assert.equal(claimContact.address, "Private address");
});

test("organization names make sensible display names for legacy profiles", () => {
  assert.equal(
    getDisplayName({ organisationName: "Read Together Foundation", email: "ngo@example.test" }),
    "Read Together Foundation"
  );
});

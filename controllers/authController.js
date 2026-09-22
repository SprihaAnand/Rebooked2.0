const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Session = require("../models/sessionModel");
const {
  CANONICAL_ROLES,
  REGISTRABLE_ROLES,
  getUserRole,
  toPublicUser,
} = require("../config/roles");
const {
  normalizeEmail,
  isValidEmail,
  cleanText,
  normalizeRegistrationRole,
} = require("../utils/validation");
const {
  createSession,
  setSessionCookies,
  clearSessionCookies,
} = require("../utils/session");

let googleClient;

function getGoogleClient() {
  if (!process.env.GOOGLE_CLIENT_ID) return null;
  if (!googleClient) googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return googleClient;
}

function invalid(res, message, status = 400) {
  return res.status(status).send({ success: false, message });
}

function profileFromRequest(body, role, googleProfile = {}) {
  const name = cleanText(body.name || googleProfile.name, 120);
  const organizationName = cleanText(
    body.organizationName || body.organisationName,
    160
  );
  const schoolName = cleanText(
    body.schoolName || body.instituteName || (role === CANONICAL_ROLES.SCHOOL ? organizationName : ""),
    160
  );

  if (role === CANONICAL_ROLES.DONOR && !name) {
    return { error: "A name is required for a donor account" };
  }
  if (role === CANONICAL_ROLES.NGO && !organizationName) {
    return { error: "An organization name is required for an NGO account" };
  }
  if (role === CANONICAL_ROLES.SCHOOL && !schoolName) {
    return { error: "A school name is required for a school account" };
  }

  return {
    value: {
      name: name || undefined,
      organizationName: organizationName || undefined,
      schoolName: schoolName || undefined,
      // Keep legacy fields synchronized for the old dashboard until it is
      // fully replaced by canonical role/profile names.
      organisationName: organizationName || undefined,
      instituteName: schoolName || undefined,
      phone: cleanText(body.phone, 40) || undefined,
      address: cleanText(body.address, 300) || undefined,
      website: cleanText(body.website, 2048) || undefined,
    },
  };
}

async function establishSession(req, res, user, authMethod, status = 200) {
  const credentials = await createSession(user, req, authMethod);
  setSessionCookies(res, credentials);
  return res.status(status).send({
    success: true,
    message: "Authenticated successfully",
    user: toPublicUser(user, { includeContact: true }),
    session: {
      id: String(credentials.session._id),
      expiresAt: credentials.session.expiresAt,
    },
  });
}

function assertActive(user, res) {
  if ((user.status || "active") === "active") return true;
  invalid(res, "This account is not active. Contact an administrator for help.", 403);
  return false;
}

async function registerController(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const role = normalizeRegistrationRole(req.body.role);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!isValidEmail(email)) return invalid(res, "Provide a valid email address");
    if (!role || !REGISTRABLE_ROLES.includes(role)) {
      return invalid(res, "Choose donor, NGO, or school as the account role");
    }
    if (password.length < 8 || password.length > 128) {
      return invalid(res, "Password must be between 8 and 128 characters");
    }

    const profile = profileFromRequest(req.body, role);
    if (profile.error) return invalid(res, profile.error);

    const existingUser = await User.findOne({ email });
    if (existingUser) return invalid(res, "An account already exists for this email", 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      ...profile.value,
      role,
      email,
      password: hashedPassword,
      status: "active",
    });

    return establishSession(req, res, user, "password", 201);
  } catch (error) {
    if (error?.code === 11000) {
      return invalid(res, "An account already exists for this email", 409);
    }
    console.error("Registration failed", error.message);
    return invalid(res, "Unable to create the account", 500);
  }
}

async function loginController(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!isValidEmail(email) || !password) {
      return invalid(res, "Invalid email or password", 401);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user?.password) {
      return invalid(res, "Invalid email or password", 401);
    }
    if (!assertActive(user, res)) return undefined;

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return invalid(res, "Invalid email or password", 401);

    user.lastLoginAt = new Date();
    await user.save();
    return establishSession(req, res, user, "password");
  } catch (error) {
    console.error("Login failed", error.message);
    return invalid(res, "Unable to sign in", 500);
  }
}

async function googleLoginController(req, res) {
  try {
    const client = getGoogleClient();
    if (!client) {
      return invalid(res, "Google sign-in has not been configured", 503);
    }

    const credential = req.body.credential || req.body.idToken;
    if (typeof credential !== "string" || !credential) {
      return invalid(res, "A Google credential is required");
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    if (!payload?.sub || !isValidEmail(email) || payload.email_verified !== true) {
      return invalid(res, "Google did not return a verified email address", 401);
    }

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      // A Google-verified email alone must not silently take over a local
      // password account.  Otherwise an attacker could pre-register a
      // victim's address, then the victim's first Google sign-in would attach
      // to the attacker-created account.  An existing unverified local
      // account therefore needs its current password as an explicit linking
      // proof.  Accounts already verified by this service may link normally.
      user = await User.findOne({ email });
      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          return invalid(res, "This email is already linked to another Google account", 409);
        }

        if (!user.emailVerifiedAt) {
          const linkingPassword =
            typeof req.body.linkPassword === "string" ? req.body.linkPassword : "";
          const passwordUser = await User.findById(user._id).select("+password");
          const passwordMatches =
            Boolean(linkingPassword && passwordUser?.password) &&
            (await bcrypt.compare(linkingPassword, passwordUser.password));

          if (!passwordMatches) {
            return res.status(409).send({
              success: false,
              linkRequired: true,
              message:
                "An email/password account already exists. Enter its password to link Google sign-in.",
            });
          }
          user = passwordUser;
        }
        user.googleId = payload.sub;
        user.emailVerifiedAt = new Date();
        if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
        await user.save();
      }
    }

    if (!user) {
      const role = normalizeRegistrationRole(req.body.role);
      if (!role || !REGISTRABLE_ROLES.includes(role)) {
        return res.status(200).send({
          success: true,
          onboardingRequired: true,
          message: "Finish setting up your donor, NGO, or school profile to continue.",
          profile: {
            email,
            name: cleanText(payload.name, 120),
            avatarUrl: payload.picture,
          },
        });
      }

      const profile = profileFromRequest(req.body, role, payload);
      if (profile.error) {
        return res.status(200).send({
          success: true,
          onboardingRequired: true,
          message: profile.error,
          profile: { email, name: cleanText(payload.name, 120), avatarUrl: payload.picture },
        });
      }

      user = await User.create({
        ...profile.value,
        role,
        email,
        googleId: payload.sub,
        emailVerifiedAt: new Date(),
        avatarUrl: payload.picture,
        status: "active",
      });
    }

    if (!assertActive(user, res)) return undefined;
    user.lastLoginAt = new Date();
    await user.save();
    return establishSession(req, res, user, "google");
  } catch (error) {
    console.error("Google sign-in failed", error.message);
    return invalid(res, "Unable to verify the Google sign-in", 401);
  }
}

async function currentUserController(req, res) {
  return res.status(200).send({
    success: true,
    user: toPublicUser(req.auth.user, { includeContact: true }),
  });
}

async function updateProfileController(req, res) {
  try {
    const user = await User.findById(req.auth.user._id);
    if (!user) return invalid(res, "Account not found", 404);

    const role = getUserRole(user);
    const profileInput = { ...user.toObject(), ...req.body };
    // A school profile form may use the human-friendly organizationName
    // field.  Prefer an explicitly submitted value over a stale persisted
    // schoolName, then keep the canonical and legacy fields in sync.
    if (
      role === CANONICAL_ROLES.SCHOOL &&
      !req.body.schoolName &&
      !req.body.instituteName &&
      (req.body.organizationName || req.body.organisationName)
    ) {
      const submittedSchoolName = req.body.organizationName || req.body.organisationName;
      profileInput.schoolName = submittedSchoolName;
      profileInput.instituteName = submittedSchoolName;
    }

    const profile = profileFromRequest(profileInput, role);
    if (profile.error) return invalid(res, profile.error);

    Object.assign(user, profile.value);
    await user.save();
    return res.status(200).send({
      success: true,
      message: "Profile updated",
      user: toPublicUser(user, { includeContact: true }),
    });
  } catch (error) {
    console.error("Profile update failed", error.message);
    return invalid(res, "Unable to update profile", 500);
  }
}

async function logoutController(req, res) {
  try {
    if (req.auth?.session) {
      await Session.updateOne(
        { _id: req.auth.session._id, user: req.auth.user._id },
        { $set: { revokedAt: new Date() } }
      );
    }
    clearSessionCookies(res);
    return res.status(200).send({ success: true, message: "Signed out successfully" });
  } catch (error) {
    console.error("Logout failed", error.message);
    return invalid(res, "Unable to sign out", 500);
  }
}

async function logoutAllController(req, res) {
  try {
    await Session.updateMany(
      { user: req.auth.user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    clearSessionCookies(res);
    return res.status(200).send({ success: true, message: "All sessions were signed out" });
  } catch (error) {
    console.error("Global logout failed", error.message);
    return invalid(res, "Unable to sign out all sessions", 500);
  }
}

async function getSessionsController(req, res) {
  try {
    const sessions = await Session.find({
      user: req.auth.user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .select("authMethod expiresAt lastSeenAt userAgent ipAddress createdAt")
      .sort({ lastSeenAt: -1 });

    return res.status(200).send({
      success: true,
      sessions: sessions.map((session) => ({
        id: String(session._id),
        authMethod: session.authMethod,
        expiresAt: session.expiresAt,
        lastSeenAt: session.lastSeenAt,
        createdAt: session.createdAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        current: String(session._id) === String(req.auth.session?._id),
      })),
    });
  } catch (error) {
    console.error("Session list failed", error.message);
    return invalid(res, "Unable to load sessions", 500);
  }
}

async function revokeSessionController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.sessionId)) {
      return invalid(res, "Invalid session id");
    }
    const result = await Session.updateOne(
      { _id: req.params.sessionId, user: req.auth.user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    if (!result.matchedCount) return invalid(res, "Session not found", 404);
    if (String(req.auth.session?._id) === String(req.params.sessionId)) {
      clearSessionCookies(res);
    }
    return res.status(200).send({ success: true, message: "Session revoked" });
  } catch (error) {
    console.error("Session revoke failed", error.message);
    return invalid(res, "Unable to revoke session", 500);
  }
}

async function changePasswordController(req, res) {
  try {
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    if (newPassword.length < 8 || newPassword.length > 128) {
      return invalid(res, "Password must be between 8 and 128 characters");
    }

    const user = await User.findById(req.auth.user._id).select("+password");
    if (!user) return invalid(res, "Account not found", 404);
    if (user.password) {
      const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return invalid(res, "Current password is incorrect", 401);
      }
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await Session.updateMany(
      { user: user._id, _id: { $ne: req.auth.session?._id }, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    return res.status(200).send({ success: true, message: "Password updated" });
  } catch (error) {
    console.error("Password change failed", error.message);
    return invalid(res, "Unable to update password", 500);
  }
}

module.exports = {
  registerController,
  loginController,
  googleLoginController,
  currentUserController,
  updateProfileController,
  logoutController,
  logoutAllController,
  getSessionsController,
  revokeSessionController,
  changePasswordController,
};

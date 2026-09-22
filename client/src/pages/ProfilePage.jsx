import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiGlobe,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";

const recipientRoles = new Set(["school", "ngo", "institute", "organisation", "organization"]);

const getOrganizationName = (user) =>
  user?.organizationName ||
  user?.organisationName ||
  user?.schoolName ||
  user?.ngoName ||
  user?.instituteName ||
  "";

const makeProfileForm = (user) => ({
  name: user?.name || user?.displayName || "",
  organizationName: getOrganizationName(user),
  phone: user?.phone || "",
  address: user?.address || "",
  website: user?.website || "",
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout, updateProfile, user } = useAuth();
  const [form, setForm] = useState(() => makeProfileForm(user));
  const [formError, setFormError] = useState("");

  const isRecipient = recipientRoles.has(user?.role);
  const roleLabel = useMemo(() => {
    if (!user?.role) return "Member";
    if (user.role === "ngo") return "NGO partner";
    return `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`;
  }, [user?.role]);

  useEffect(() => {
    setForm(makeProfileForm(user));
  }, [user]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (form.name.trim().length < 2) {
      setFormError("Enter the name we should use for your account.");
      return;
    }

    if (isRecipient && form.organizationName.trim().length < 2) {
      setFormError("Enter your school or NGO name.");
      return;
    }

    try {
      const updates = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        website: form.website.trim(),
      };

      if (isRecipient) updates.organizationName = form.organizationName.trim();

      await updateProfile(updates);
      toast.success("Your profile has been updated.");
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You’ve been signed out.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <main className="profile-page profile-page--empty">
        <h1>Your session has ended</h1>
        <p>Sign in again to view or update your profile.</p>
        <Link className="auth-submit" to="/login">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          {(form.name || user?.email || "R").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="auth-eyebrow">Account settings</p>
          <h1>{form.name || "Your profile"}</h1>
          <p>
            <span className="profile-role-badge">{roleLabel}</span>
            <span>{user?.email}</span>
          </p>
        </div>
      </section>

      <section className="profile-card" aria-labelledby="profile-details-title">
        <div className="profile-card__heading">
          <div>
            <h2 id="profile-details-title">Profile details</h2>
            <p>Keep these details current so book handoffs can be coordinated smoothly.</p>
          </div>
          <button className="profile-logout" type="button" onClick={handleLogout} disabled={loading}>
            <FiLogOut aria-hidden="true" /> Sign out
          </button>
        </div>

        {formError && (
          <div className="auth-form-error" role="alert">
            {formError}
          </div>
        )}

        <form className="auth-form profile-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field-row">
            <label className="auth-field" htmlFor="profile-name">
              <span>Your name</span>
              <span className="auth-input-wrap">
                <FiUser aria-hidden="true" />
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField}
                  disabled={loading}
                  required
                />
              </span>
            </label>

            <label className="auth-field" htmlFor="profile-email">
              <span>Email address</span>
              <span className="auth-input-wrap">
                <FiMail aria-hidden="true" />
                <input id="profile-email" type="email" value={user?.email || ""} disabled readOnly />
              </span>
            </label>
          </div>

          {isRecipient && (
            <label className="auth-field" htmlFor="profile-organization">
              <span>{user?.role === "school" ? "School name" : "Organisation name"}</span>
              <span className="auth-input-wrap">
                <FiBriefcase aria-hidden="true" />
                <input
                  id="profile-organization"
                  name="organizationName"
                  type="text"
                  autoComplete="organization"
                  value={form.organizationName}
                  onChange={updateField}
                  disabled={loading}
                  required
                />
              </span>
            </label>
          )}

          <div className="auth-field-row">
            <label className="auth-field" htmlFor="profile-phone">
              <span>Phone</span>
              <span className="auth-input-wrap">
                <FiPhone aria-hidden="true" />
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="For pickup coordination"
                  disabled={loading}
                />
              </span>
            </label>

            <label className="auth-field" htmlFor="profile-address">
              <span>City or locality</span>
              <span className="auth-input-wrap">
                <FiMapPin aria-hidden="true" />
                <input
                  id="profile-address"
                  name="address"
                  type="text"
                  autoComplete="address-level2"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Where you’re based"
                  disabled={loading}
                />
              </span>
            </label>
          </div>

          <label className="auth-field" htmlFor="profile-website">
            <span>Website <small>(optional)</small></span>
            <span className="auth-input-wrap">
              <FiGlobe aria-hidden="true" />
              <input
                id="profile-website"
                name="website"
                type="url"
                autoComplete="url"
                value={form.website}
                onChange={updateField}
                placeholder="https://example.org"
                disabled={loading}
              />
            </span>
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            <FiSave aria-hidden="true" /> {loading ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>
    </main>
  );
}

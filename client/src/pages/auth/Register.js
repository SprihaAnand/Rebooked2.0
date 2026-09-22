import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/AuthContext";
import GoogleSignInButton from "../../auth/GoogleSignInButton";

const accountTypes = [
  {
    value: "donor",
    title: "I donate books",
    description: "List books and follow them to their next reader.",
  },
  {
    value: "school",
    title: "I represent a school",
    description: "Request book collections for students and classrooms.",
  },
  {
    value: "ngo",
    title: "I represent an NGO",
    description: "Connect donated books with communities that need them.",
  },
];

const getSafeDestination = (location) => {
  const requestedPath = location.state?.from?.pathname;
  return typeof requestedPath === "string" && requestedPath.startsWith("/")
    ? requestedPath
    : "/dashboard";
};

const initialForm = {
  name: "",
  role: "donor",
  organizationName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
};

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading, loginWithGoogle, register } = useAuth();
  const requestedRole = searchParams.get("role");
  const roleFromQuery = accountTypes.some((accountType) => accountType.value === requestedRole)
    ? requestedRole
    : "donor";
  const [form, setForm] = useState(() => ({
    ...initialForm,
    role: roleFromQuery,
    name: location.state?.googleProfile?.name || "",
    email: location.state?.googleProfile?.email || "",
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const destination = useMemo(() => getSafeDestination(location), [location]);
  const isRecipient = form.role === "school" || form.role === "ngo";

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [destination, isAuthenticated, loading, navigate]);

  useEffect(() => {
    setForm((current) => ({ ...current, role: roleFromQuery }));
  }, [roleFromQuery]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validateRegistration = () => {
    if (form.name.trim().length < 2) return "Enter the name we should use for your account.";
    if (!form.email.trim()) return "Enter an email address.";
    if (form.password.length < 8) return "Use a password with at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Your passwords do not match.";
    if (isRecipient && form.organizationName.trim().length < 2) {
      return "Enter your school or NGO name.";
    }
    return "";
  };

  const buildRegistrationPayload = () => {
    const payload = {
      name: form.name.trim(),
      role: form.role,
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    };

    if (isRecipient) payload.organizationName = form.organizationName.trim();
    return payload;
  };

  const finishRegistration = (message) => {
    toast.success(message);
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateRegistration();
    setFormError(validationMessage);
    if (validationMessage) return;

    try {
      await register(buildRegistrationPayload());
      finishRegistration("Your Rebooked account is ready.");
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setFormError("");

    if (form.name.trim().length < 2) {
      setFormError("Enter your name before creating a Google account.");
      return;
    }

    if (isRecipient && form.organizationName.trim().length < 2) {
      setFormError("Enter your school or NGO name before continuing with Google.");
      return;
    }

    try {
      const metadata = {
        role: form.role,
        name: form.name.trim(),
        linkPassword: form.password,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };

      if (isRecipient) {
        metadata.organizationName = form.organizationName.trim();
        if (form.role === "school") metadata.schoolName = form.organizationName.trim();
      }

      await loginWithGoogle(credential, metadata);
      finishRegistration("Your Rebooked account is ready.");
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <main className="auth-page auth-page--register">
      <section className="auth-showcase" aria-label="About Rebooked">
        <div className="auth-brand">
          <FiBookOpen aria-hidden="true" />
          <span>Rebooked</span>
        </div>
        <p className="auth-eyebrow">Join the book cycle.</p>
        <h1>One account can put a whole shelf to work.</h1>
        <p>
          Whether you have books to give or readers to support, Rebooked makes each handoff
          visible, accountable, and simple.
        </p>
      </section>

      <section className="auth-panel" aria-labelledby="register-title">
        <div className="auth-panel__inner auth-panel__inner--wide">
          <p className="auth-eyebrow">Create your account</p>
          <h2 id="register-title">Start making books matter</h2>
          <p className="auth-panel__lead">
            Choose the account that describes how you’ll use Rebooked. Administrator accounts
            are created only by the platform team.
          </p>

          {location.state?.googleProfile && (
            <p className="auth-google-hint" role="status">
              We found your Google account. Choose how you’ll use Rebooked, then continue with
              Google below.
            </p>
          )}

          {formError && (
            <div className="auth-form-error" role="alert">
              {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <fieldset className="auth-role-fieldset" disabled={loading}>
              <legend>How will you use Rebooked?</legend>
              <div className="auth-role-grid">
                {accountTypes.map((accountType) => (
                  <label
                    className={
                      form.role === accountType.value
                        ? "auth-role-option auth-role-option--selected"
                        : "auth-role-option"
                    }
                    key={accountType.value}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={accountType.value}
                      checked={form.role === accountType.value}
                      onChange={updateField}
                    />
                    <strong>{accountType.title}</strong>
                    <span>{accountType.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="auth-field" htmlFor="register-name">
              <span>Your name</span>
              <span className="auth-input-wrap">
                <FiUser aria-hidden="true" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Your full name"
                  disabled={loading}
                  required
                />
              </span>
            </label>

            {isRecipient && (
              <label className="auth-field" htmlFor="register-organization">
                <span>{form.role === "school" ? "School name" : "NGO name"}</span>
                <span className="auth-input-wrap">
                  <FiBriefcase aria-hidden="true" />
                  <input
                    id="register-organization"
                    name="organizationName"
                    type="text"
                    autoComplete="organization"
                    value={form.organizationName}
                    onChange={updateField}
                    placeholder={form.role === "school" ? "Your school" : "Your NGO"}
                    disabled={loading}
                    required
                  />
                </span>
              </label>
            )}

            <label className="auth-field" htmlFor="register-email">
              <span>Email address</span>
              <span className="auth-input-wrap">
                <FiMail aria-hidden="true" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.org"
                  disabled={loading}
                  required
                />
              </span>
            </label>

            <label className="auth-field" htmlFor="register-password">
              <span>Password</span>
              <span className="auth-input-wrap">
                <FiLock aria-hidden="true" />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="At least 8 characters"
                  disabled={loading}
                  required
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </span>
            </label>

            <label className="auth-field" htmlFor="register-confirm-password">
              <span>Confirm password</span>
              <span className="auth-input-wrap">
                <FiLock aria-hidden="true" />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={updateField}
                  placeholder="Type it again"
                  disabled={loading}
                  required
                />
              </span>
            </label>

            <div className="auth-field-row">
              <label className="auth-field" htmlFor="register-phone">
                <span>Phone <small>(optional)</small></span>
                <span className="auth-input-wrap">
                  <FiPhone aria-hidden="true" />
                  <input
                    id="register-phone"
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

              <label className="auth-field" htmlFor="register-address">
                <span>City or locality <small>(optional)</small></span>
                <span className="auth-input-wrap">
                  <FiMapPin aria-hidden="true" />
                  <input
                    id="register-address"
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

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating your account…" : "Create account"}
              {!loading && <FiArrowRight aria-hidden="true" />}
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span />
            <em>or</em>
            <span />
          </div>

          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />
          <p className="auth-google-hint">
            Choose an account type and enter your name before continuing with Google.
          </p>

          <p className="auth-switch-copy">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

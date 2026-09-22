import { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiBookOpen, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/AuthContext";
import GoogleSignInButton from "../../auth/GoogleSignInButton";

const getSafeDestination = (location) => {
  const requestedPath = location.state?.from?.pathname;
  return typeof requestedPath === "string" && requestedPath.startsWith("/")
    ? requestedPath
    : "/dashboard";
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const destination = useMemo(() => getSafeDestination(location), [location]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [destination, isAuthenticated, loading, navigate]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const finishSignIn = (currentUser, message) => {
    toast.success(message || `Welcome back${currentUser?.name ? `, ${currentUser.name}` : ""}!`);
    navigate(destination, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.email.trim() || !form.password) {
      setFormError("Enter both your email address and password.");
      return;
    }

    try {
      const currentUser = await login(form);
      finishSignIn(currentUser);
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setFormError("");
    try {
      const currentUser = await loginWithGoogle(credential, {
        // The server uses this only to safely link a Google identity to an
        // existing password account with the same email.
        linkPassword: form.password,
      });
      finishSignIn(currentUser, "You’re signed in with Google.");
    } catch (error) {
      if (error.code === "ONBOARDING_REQUIRED") {
        toast.info("Choose an account type to finish setting up Google sign-in.");
        navigate("/register", {
          replace: true,
          state: { googleProfile: error.onboardingProfile },
        });
        return;
      }
      setFormError(error.message);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-label="About Rebooked">
        <div className="auth-brand">
          <FiBookOpen aria-hidden="true" />
          <span>Rebooked</span>
        </div>
        <p className="auth-eyebrow">Books find their next reader.</p>
        <h1>Put every good book back into circulation.</h1>
        <p>
          Sign in to donate books, discover available collections, or coordinate a request for
          your school or NGO.
        </p>
        <div className="auth-impact-points" aria-label="Platform benefits">
          <span>Donate with confidence</span>
          <span>Match books to needs</span>
          <span>Track real impact</span>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-panel__inner">
          <p className="auth-eyebrow">Welcome back</p>
          <h2 id="login-title">Sign in to Rebooked</h2>
          <p className="auth-panel__lead">
            Your account type is recognized automatically after you sign in.
          </p>

          {formError && (
            <div className="auth-form-error" role="alert">
              {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field" htmlFor="login-email">
              <span>Email address</span>
              <span className="auth-input-wrap">
                <FiMail aria-hidden="true" />
                <input
                  id="login-email"
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

            <label className="auth-field" htmlFor="login-password">
              <span>Password</span>
              <span className="auth-input-wrap">
                <FiLock aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="Enter your password"
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

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing you in…" : "Sign in"}
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
            Already use this email with a password? Enter it above before continuing with Google to link your account safely.
          </p>

          <p className="auth-switch-copy">
            New to Rebooked? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

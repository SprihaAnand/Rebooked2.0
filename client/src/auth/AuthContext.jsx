import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { attachCsrfHeader } from "../utils/csrf";

const configuredBaseUrl =
  [process.env.REACT_APP_API_URL, process.env.REACT_APP_BASEURL, "/api/v1"]
    .find((value) => typeof value === "string" && value.trim())
    ?.trim() || "/api/v1";

/**
 * Authentication is deliberately cookie based.  No access token is put in
 * localStorage/sessionStorage, so closing a tab cannot leak credentials to a
 * script running on this origin.  The API is exported for feature clients
 * which need the same `withCredentials` behavior.
 */
export const authApi = axios.create({
  baseURL: configuredBaseUrl.replace(/\/$/, ""),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

authApi.interceptors.request.use(attachCsrfHeader);

const AuthContext = createContext(undefined);

const unauthenticatedStatusCodes = new Set([401, 403]);

const getPayload = (response) => response?.data?.data || response?.data || {};

const getUserFromResponse = (response) => {
  const payload = getPayload(response);

  if (payload?.user) return payload.user;
  if (payload?.data?.user) return payload.data.user;

  // This keeps the client tolerant of a compact `{ _id, email, role }`
  // response while still rejecting success responses without a user object.
  return payload?._id || payload?.id ? payload : null;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  fallback;

const isUnauthenticatedError = (error) =>
  unauthenticatedStatusCodes.has(error?.response?.status);

const normalizeEmail = (email) => email?.trim().toLowerCase();

const createMissingUserError = () =>
  new Error("We could not confirm your account. Please try again.");

const createAuthError = (error, fallback) => {
  const normalizedError = new Error(getErrorMessage(error, fallback));
  normalizedError.code = error?.code;
  normalizedError.onboardingProfile = error?.onboardingProfile;
  return normalizedError;
};

/**
 * Owns the browser session for the entire app.
 *
 * The backend should set an HttpOnly, Secure (in production) session cookie
 * on login/register/Google sign-in.  Every request below includes it through
 * axios' `withCredentials` option.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [mutating, setMutating] = useState(false);

  const requestCurrentUser = useCallback(async (config = {}) => {
    const response = await authApi.get("/auth/current-user", config);
    const currentUser = getUserFromResponse(response);

    if (!currentUser) {
      throw createMissingUserError();
    }

    return currentUser;
  }, []);

  // Hydrate the session exactly once per provider mount.  An aborted request
  // is important in React StrictMode, where effects may mount twice in dev.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const hydrateSession = async () => {
      try {
        const currentUser = await requestCurrentUser({ signal: controller.signal });
        if (active) setUser(currentUser);
      } catch (error) {
        if (!active || error?.code === "ERR_CANCELED") return;

        // A missing/expired cookie is an ordinary signed-out state. Other
        // failures are treated the same for routing; individual actions still
        // surface their own actionable error messages.
        setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    };

    hydrateSession();

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestCurrentUser]);

  const refreshSession = useCallback(async () => {
    setMutating(true);
    try {
      const currentUser = await requestCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (isUnauthenticatedError(error)) setUser(null);
      throw createAuthError(error, "Unable to refresh your session. Please try again.");
    } finally {
      setMutating(false);
    }
  }, [requestCurrentUser]);

  const completeAuthentication = useCallback(
    async (response) => {
      const responseUser = getUserFromResponse(response);
      const currentUser = responseUser || (await requestCurrentUser());
      setUser(currentUser);
      return currentUser;
    },
    [requestCurrentUser]
  );

  const login = useCallback(
    async ({ email, password }) => {
      setMutating(true);
      try {
        const response = await authApi.post("/auth/login", {
          email: normalizeEmail(email),
          password,
        });
        return await completeAuthentication(response);
      } catch (error) {
        setUser(null);
        throw createAuthError(error, "Unable to sign in. Please try again.");
      } finally {
        setMutating(false);
      }
    },
    [completeAuthentication]
  );

  const register = useCallback(
    async (registration) => {
      setMutating(true);
      try {
        const payload = {
          ...registration,
          email: normalizeEmail(registration.email),
        };
        const response = await authApi.post("/auth/register", payload);
        return await completeAuthentication(response);
      } catch (error) {
        throw createAuthError(error, "Unable to create your account. Please try again.");
      } finally {
        setMutating(false);
      }
    },
    [completeAuthentication]
  );

  const loginWithGoogle = useCallback(
    async (credential, metadata = {}) => {
      if (!credential) {
        throw new Error("Google did not return a sign-in credential. Please try again.");
      }

      setMutating(true);
      try {
        const response = await authApi.post("/auth/google", {
          credential,
          ...metadata,
        });

        const payload = getPayload(response);
        if (payload?.onboardingRequired) {
          const onboardingError = new Error(
            payload.message || "Finish setting up your account before continuing."
          );
          onboardingError.code = "ONBOARDING_REQUIRED";
          onboardingError.onboardingProfile = payload.profile;
          throw onboardingError;
        }

        return await completeAuthentication(response);
      } catch (error) {
        setUser(null);
        throw createAuthError(error, "Google sign-in could not be completed. Please try again.");
      } finally {
        setMutating(false);
      }
    },
    [completeAuthentication]
  );

  const logout = useCallback(async () => {
    setMutating(true);
    try {
      await authApi.post("/auth/logout");
      setUser(null);
    } catch (error) {
      // Keep local identity if the server did not revoke the cookie-backed
      // session. Treating a failed request as a completed logout would send
      // the user to a login screen while their session remained valid.
      throw createAuthError(error, "Unable to sign out. Please try again.");
    } finally {
      setMutating(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      setMutating(true);
      try {
        const response = await authApi.patch("/auth/profile", updates);
        const updatedUser = getUserFromResponse(response) || (await requestCurrentUser());
        setUser(updatedUser);
        return updatedUser;
      } catch (error) {
        throw createAuthError(error, "Unable to save your profile. Please try again.");
      } finally {
        setMutating(false);
      }
    },
    [requestCurrentUser]
  );

  const value = useMemo(
    () => ({
      user,
      loading: initializing || mutating,
      login,
      register,
      loginWithGoogle,
      logout,
      updateProfile,
      isAuthenticated: Boolean(user),
      refreshSession,
    }),
    [
      initializing,
      login,
      loginWithGoogle,
      logout,
      mutating,
      refreshSession,
      register,
      updateProfile,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

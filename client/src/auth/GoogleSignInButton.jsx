import { useEffect, useRef, useState } from "react";
import { FaGoogle } from "react-icons/fa";

const GOOGLE_SCRIPT_ID = "rebooked-google-identity-services";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let googleScriptPromise;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services could not be loaded.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google Identity Services could not be loaded."));
    document.head.appendChild(script);
  }).catch((error) => {
    // Allow a later remount to retry after a network failure.
    googleScriptPromise = undefined;
    throw error;
  });

  return googleScriptPromise;
};

const configuredClientId =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID ||
  "";

/**
 * Small wrapper around Google Identity Services.  It intentionally does not
 * use an SDK package: the public GIS script is loaded only when the deployment
 * supplies a client id, and the API receives Google's signed ID credential.
 */
export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonHostRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const [state, setState] = useState(configuredClientId ? "loading" : "unavailable");

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    if (!configuredClientId) return undefined;

    let active = true;

    const renderGoogleButton = async () => {
      try {
        const google = await loadGoogleIdentityServices();

        if (!active || !buttonHostRef.current || !google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: configuredClientId,
          callback: (response) => {
            if (response?.credential && !disabledRef.current) {
              onCredentialRef.current?.(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonHostRef.current.replaceChildren();
        google.accounts.id.renderButton(buttonHostRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
        });
        setState("ready");
      } catch (error) {
        if (active) setState("error");
      }
    };

    renderGoogleButton();

    return () => {
      active = false;
      if (buttonHostRef.current) buttonHostRef.current.replaceChildren();
    };
  }, []);

  if (state === "unavailable") {
    return (
      <p className="auth-google-message" role="status">
        <FaGoogle aria-hidden="true" /> Google sign-in is not configured for this deployment.
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="auth-google-message auth-google-message--error" role="alert">
        <FaGoogle aria-hidden="true" /> Google sign-in is temporarily unavailable. You can still
        continue with email.
      </p>
    );
  }

  return (
    <div className="auth-google-control" aria-busy={state === "loading"}>
      <div
        ref={buttonHostRef}
        className={disabled ? "auth-google-button auth-google-button--disabled" : "auth-google-button"}
        aria-disabled={disabled}
      />
      {disabled && <span className="auth-google-overlay" aria-hidden="true" />}
      {state === "loading" && <span className="auth-google-loading">Preparing Google sign-in…</span>}
    </div>
  );
}

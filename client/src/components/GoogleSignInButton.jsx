import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { googleLoginUser } from "../redux/auth/authThunk";

const GOOGLE_SCRIPT_ID = "google-identity-services";

const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let script = document.getElementById(GOOGLE_SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
  });
};

export default function GoogleSignInButton({ onSuccess }) {
  const buttonRef = useRef(null);
  const dispatch = useDispatch();
  const [scriptError, setScriptError] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;
    let active = true;

    loadGoogleIdentity()
      .then(() => {
        if (!active || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            try {
              const result = await dispatch(googleLoginUser(credential)).unwrap();
              toast.success("Signed in successfully.");
              onSuccess?.(result?.data?.user);
            } catch (error) {
              toast.error(error || "Google sign in failed.");
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: Math.min(buttonRef.current.clientWidth || 360, 400),
        });
      })
      .catch(() => setScriptError(true));

    return () => {
      active = false;
    };
  }, [clientId, dispatch, onSuccess]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm text-slate-500">
        Google sign-in needs a configured client ID.
      </div>
    );
  }

  return (
    <div className="min-h-10 w-full">
      <div ref={buttonRef} className="flex min-h-10 justify-center" />
      {scriptError && (
        <p className="mt-2 text-center text-xs text-rose-600">
          Google sign-in couldn’t load. Check your connection and try again.
        </p>
      )}
    </div>
  );
}

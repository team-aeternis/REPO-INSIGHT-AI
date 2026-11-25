import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { acceptTerms } from "../services/authService";
import { setUser } from "../redux/auth/authSlice";

const TERMS_VERSION = "2026-11-v1";

export default function TermsAcceptanceGate({ children }) {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [hasReadToEnd, setHasReadToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const termsBodyRef = useRef(null);

  if (user?.termsVersion === TERMS_VERSION && user?.termsAcceptedAt) {
    return children;
  }

  const handleScroll = (event) => {
    const element = event.currentTarget;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 12) {
      setHasReadToEnd(true);
    }
  };

  const handleAccept = async () => {
    if (!hasReadToEnd || !checked || saving) return;
    setSaving(true);
    try {
      const response = await acceptTerms();
      if (!response?.success || !response?.data?.user) {
        throw new Error(response?.message || "Unable to save your agreement.");
      }
      dispatch(setUser(response.data.user));
      window.dispatchEvent(new Event("repo-insight:chat-sessions-updated"));
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to save your agreement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="border-b border-slate-200 px-5 py-4 sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Before you explore
          </p>
          <h1 id="terms-title" className="mt-1 text-xl font-semibold text-slate-950">
            Terms of use and project policy
          </h1>
          <p className="mt-1 text-xs text-slate-500">Version {TERMS_VERSION}</p>
        </header>

        <div
          ref={termsBodyRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Terms of use and project policy text"
          className="max-h-[40dvh] min-h-48 flex-none space-y-5 overflow-y-auto px-5 py-5 text-sm leading-6 text-slate-700 sm:px-7"
        >
          <section>
            <h2 className="font-semibold text-slate-900">Using repository analysis</h2>
            <p>Only submit GitHub repositories that you own or are authorized to analyze. Do not use this service to access, copy, or expose code without permission.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Your code and chat data</h2>
            <p>Repository records and chat history are separated by account. Submitted source code, repository details, prompts, and generated answers are stored to provide analysis and restore your chats. The app keeps up to 10 recent repositories and 20 recent chats per account; older records and their associated analysis data are automatically deleted as new ones are added.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">AI processing and answer quality</h2>
            <p>Repository content and questions may be sent to the AI model provider configured for this project to generate answers. AI output can be incomplete or incorrect. Review important findings against the source code; do not treat results as security, legal, or operational guarantees.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Keep secrets out of prompts</h2>
            <p>Do not submit passwords, API keys, access tokens, private personal information, or other sensitive material in chat prompts. You are responsible for the content and repositories you submit.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Fair use and availability</h2>
            <p>Do not abuse the service, bypass request limits, interfere with other users, or attempt to access another account’s data. The project may be rate-limited, unavailable, or changed while it is hosted on a free or development plan.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Your agreement</h2>
            <p>By continuing, you confirm that you have read this policy and agree to use Repo Insight AI responsibly. This agreement is recorded with your account so it is not required again for this version.</p>
          </section>
        </div>

        <footer className="border-t border-slate-200 px-5 py-4 sm:px-7">
          <p className="mb-3 text-xs text-slate-500" aria-live="polite">
            {hasReadToEnd ? "You reached the end. Confirm below to continue." : "Scroll through the policy to continue."}
          </p>
          <label className={`flex items-start gap-2 text-sm ${hasReadToEnd ? "text-slate-700" : "text-slate-400"}`}>
            <input
              type="checkbox"
              checked={checked}
              disabled={!hasReadToEnd || saving}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 accent-teal-600"
            />
            <span>I have read and agree to the terms of use and project policy.</span>
          </label>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!hasReadToEnd || !checked || saving}
            className="mt-4 w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Saving agreement..." : "Agree and continue"}
          </button>
        </footer>
      </section>
    </div>
  );
}

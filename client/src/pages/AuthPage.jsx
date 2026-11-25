import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import { toast } from "react-toastify";
import Hero from "../components/Hero";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { loginUser, registerUser } from "../redux/auth/authThunk";

const fieldClass =
  "mt-1.5 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", age: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const { loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = location.state?.from?.pathname || "/welcome";

  const finishSignIn = useCallback(() => {
    navigate(returnPath, { replace: true });
  }, [navigate, returnPath]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const action = isSignup
        ? registerUser({ ...form, age: Number(form.age) })
        : loginUser({ email: form.email, password: form.password });
      await dispatch(action).unwrap();
      toast.success("Signed in successfully.");
      finishSignIn();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-100 lg:h-dvh lg:min-h-[640px] lg:overflow-hidden">
      <div className="mx-auto grid min-h-dvh w-full max-w-none grid-cols-1 bg-slate-100 lg:h-dvh lg:min-h-[640px] lg:grid-cols-[minmax(400px,32vw)_1fr]">
        <section className="order-2 flex items-center justify-center bg-slate-100 px-5 py-6 sm:px-10 sm:py-8 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-5 xl:px-10">
          <div className="w-full max-w-[460px]">
            <Link to="/" className="mb-5 inline-flex items-center gap-2.5 text-slate-900">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-600 text-white">
                <AutoGraphIcon fontSize="small" />
              </span>
              <span className="text-sm font-semibold tracking-tight">Repo Insight AI</span>
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Your workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {isSignup ? "Sign up" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm leading-5 text-slate-500">
              {isSignup
                ? "Create your account to get started."
                : "Your repositories are ready."}
            </p>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              {isSignup && (
                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <label className="text-sm font-medium text-slate-700">
                    Full name
                    <input
                      className={fieldClass}
                      autoComplete="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Age
                    <input
                      className={fieldClass}
                      name="age"
                      type="number"
                      min="13"
                      max="120"
                      value={form.age}
                      onChange={handleChange}
                      placeholder="Age"
                      required
                    />
                  </label>
                </div>
              )}

              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  className={fieldClass}
                  autoComplete="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  className={fieldClass}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
                  minLength={isSignup ? 8 : undefined}
                  maxLength={72}
                  required
                />
              </label>

              <button
                className="mt-1 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                type="submit"
                disabled={submitting || loading}
              >
                {submitting || loading
                  ? "Please wait…"
                  : isSignup
                    ? "Sign up"
                    : "Sign in"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              OR CONTINUE WITH
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleSignInButton onSuccess={finishSignIn} />

            <p className="mt-5 text-center text-sm text-slate-500">
              {isSignup ? "Already have an account?" : "New to Repo Insight AI?"}{" "}
              <Link
                className="font-semibold text-sky-700 hover:text-sky-800"
                to={isSignup ? "/auth/login" : "/auth/signup"}
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
        </section>

        <div className="hidden lg:order-2 lg:block lg:min-h-0">
          <Hero />
        </div>
      </div>
    </main>
  );
}

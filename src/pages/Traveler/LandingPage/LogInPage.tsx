import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import Hero from "../../../assets/mainbg.jpg";
import { getToken } from "../../../services/auth/authService";
import { login } from "../../../api";
import GoogleSignInButton from "../../../components/GoogleSignInButton";

export default function LogInPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const rawRedirect = from
    ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
    : "/";
  const redirectPath = rawRedirect === "/unauthorized" ? "/" : rawRedirect;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, pwd);
      console.log("Login successful!");
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (getToken()) {
    console.log("User already has token, redirecting to previous page");
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <section
          className="relative flex w-full min-h-screen items-start justify-center overflow-hidden bg-fixed bg-cover bg-top"
          aria-label="Hero background"
          style={{ backgroundImage: `url(${Hero})` }}
        >
          {/* overlay (ทับรูป แต่ใต้คอนเทนต์) */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-black/10" />

          {/* content */}
          <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-10 sm:py-16">
            <div className="mx-auto mt-12 sm:mt-16 max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
              <div className="px-6 pt-6 pb-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Log In</h1>
              </div>

              <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Password</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!email || !pwd || loading}
                  className="mt-2 w-full rounded-md bg-slate-800 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-900 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>

                {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500">OR</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <GoogleSignInButton
                  onStart={() => setError(null)}
                  onSuccess={() => {
                    setError(null);
                    navigate(redirectPath, { replace: true });
                  }}
                  onError={(message) => setError(message)}
                />

                <p className="text-xs text-slate-600 text-center">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="underline underline-offset-2 hover:text-slate-900">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="underline underline-offset-2 hover:text-slate-900">
                    Privacy Policy
                  </Link>
                  .
                </p>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <Link to="/forgot-password" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
                    Forgot password?
                  </Link>
                  <Link to="/signup" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
                    Sign Up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

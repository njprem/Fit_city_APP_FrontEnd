import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import Hero from "../../../assets/BG.jpg";
import { register } from "../../../api";
import GoogleSignInButton from "../../../components/GoogleSignInButton";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (pwd !== confirmPwd) {
    alert("Passwords do not match");
    return;
  }
  if (!acceptedTerms) {
    alert("Please accept the Terms & Conditions");
    return;
  }

  try {
    const data = await register(email, pwd);
    console.log("✅ Registration success:", data);

    alert("Registration successful!");
    navigate("/login", { replace: true });
  } catch (error) {
    console.error("❌ Registration failed:", error);
    alert(error instanceof Error ? error.message : "Registration failed");
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <section className="relative w-full min-h-[70vh] overflow-hidden" aria-label="Hero background">
          
          <img src={Hero} alt="" className="absolute inset-0 h-full w-full object-cover z-0" />
          {/* overlay (ทับรูป แต่ใต้คอนเทนต์) */}
          <div className="absolute inset-0 bg-black/10 z-10" />

          {/* content */}
          <div className="relative z-20 mx-auto max-w-7xl px-4 py-10 sm:py-16">
            <div className="mx-auto mt-6 sm:mt-10 max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
              <div className="px-6 pt-6 pb-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Sign Up
                </h1>
              </div>

              <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Email</span>
                  <input
                    type="email"
                    required
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
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Confirm Password</span>
                  <input
                    type="password"
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                  {pwd && confirmPwd && pwd !== confirmPwd && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>
                  )}
                </label>

                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    I agree to the
                    {' '}<Link to="/terms" className="underline underline-offset-2 hover:text-slate-900">Terms & Conditions</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="underline underline-offset-2 hover:text-slate-900">Privacy Policy</Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!email || !pwd || !confirmPwd || pwd !== confirmPwd || !acceptedTerms}
                  className="mt-2 w-full rounded-md bg-slate-800 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-900 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign Up
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500">OR</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <GoogleSignInButton
                  onStart={() => setGoogleError(null)}
                  onSuccess={() => {
                    setGoogleError(null);
                    navigate("/", { replace: true });
                  }}
                  onError={(message) => setGoogleError(message)}
                />
                {googleError && (
                  <p className="text-sm text-red-600 text-center">{googleError}</p>
                )}

                <div className="flex items-center justify-between pt-2 text-sm">
                  {/*<Link to="/forgot-password" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
                    Forgot password?
                  </Link> */}
                  
                  <Link to="/login" className="mx-auto text-slate-700 underline underline-offset-2 hover:text-slate-900">
                    Log In
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

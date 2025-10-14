import { useLocation, useNavigate, type Location } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";

type LocationState = {
  from?: Location;
};

export default function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as LocationState | null)?.from;

  const handleGoToLogin = () => {
    navigate("/login", { state: { from } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar showSearch={true} />
      <main className="flex-1 flex items-center justify-center px-4">
        <section className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-xl border border-slate-100">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#016B71]/10 text-[#016B71]">
            <span className="material-symbols-outlined text-3xl" aria-hidden>
              lock
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Sign In Required</h1>
          <p className="mt-3 text-sm text-slate-600">
            You need to log in to view your favourite activities. Please sign in to continue.
          </p>
          <button
            type="button"
            onClick={handleGoToLogin}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#016B71] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#01585C] active:translate-y-[1px]"
          >
            Go to Log In
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}

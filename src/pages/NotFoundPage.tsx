import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white shadow-sm rounded-xl p-8">
          <div className="text-5xl mb-4" aria-hidden>
            404
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Page not found</h1>
          <p className="text-slate-600 mb-6">
            The page you’re looking for doesn’t exist or may have been moved.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-5 py-3 rounded-full bg-[#016B71] text-white font-semibold hover:bg-[#01585C] transition"
          >
            Back to Home
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}

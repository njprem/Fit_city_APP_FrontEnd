import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/navbar";   // ให้ตรงกับชื่อไฟล์จริง (Navbar/navbar)
import Footer from "../../../components/footer";
import Hero from "../../../assets/BG.jpg";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({ email, pwd });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* main จะขยายกินพื้นที่ที่เหลือทั้งหมด แล้วดัน footer ลงล่าง */}
      <main className="flex-1">
        <section className="relative w-full min-h-[70vh] overflow-hidden" aria-label="Hero background">
          {/* BG image (อยู่ชั้นล่างสุด) */}
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
                    placeholder="Value"
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
                    placeholder="Value"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-2 w-full rounded-md bg-slate-800 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-900 active:translate-y-[1px]"
                >
                  Sign Up
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500">OR</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={() => console.log("Sign in with Google")}
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 font-medium text-slate-800 shadow-sm hover:bg-slate-50 active:translate-y-[1px] inline-flex items-center justify-center gap-2"
                >
                  {/* Google SVG */}
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 31.9 29.2 35 24 35c-6.6 0-12-5.4-12-12S17.4 11 24 11c3 0 5.7 1.1 7.8 3l5.7-5.7C34 5.4 29.3 3.5 24 3.5 16.1 3.5 9.2 7.9 6.3 14.7z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 15.8 18.8 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34 5.4 29.3 3.5 24 3.5 16.1 3.5 9.2 7.9 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 46.5c5.1 0 9.8-1.8 13.4-4.8l-6.2-5.3c-2 1.4-4.6 2.3-7.2 2.3-5.1 0-9.4-3.2-11-7.7l-6.6 5.1C9.2 42.1 16.1 46.5 24 46.5z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.6 5.8-6.7 7.2l6.2 5.3c3.6-2.6 6-6.7 6-12 0-1.5-.2-3-.5-4.5z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <Link to="/forgot-password" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
                    Forgot password?
                  </Link>
                  <Link to="/signup" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
                    Create an account
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

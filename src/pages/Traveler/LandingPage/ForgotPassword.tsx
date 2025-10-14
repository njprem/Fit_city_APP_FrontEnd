// src/pages/Auth/ForgotPasswordOnePage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { confirmPasswordReset, requestPasswordReset } from "../../../api";

export default function ForgotPasswordOnePage() {
  // form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  // ui states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [canFillOtp, setCanFillOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // notices
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  // validators
  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isOtpValid = otp.trim().length >= 6; // ปรับตามกฎ OTP
  const isPasswordValid = pwd.length >= 12;  // ปรับ policy ตามต้องการ
  const isMatch = pwd === pwd2;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || sendingOtp) return;

    try {
      setSendingOtp(true);
      setError("");
      setNotice("");
      await requestPasswordReset(email);

      // ป้องกัน email enumeration: ข้อความกลาง ๆ เหมือนกันเสมอ
      setNotice("If an account exists for that email, an OTP has been sent. Please check your inbox (and spam).");
      setCanFillOtp(true);
      setCooldown(60); // 60 วิค่อยขอใหม่
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to initiate password reset.");
      // ข้อความกลาง ๆ เช่นกัน
      setNotice("If an account exists for that email, an OTP has been sent. Please check your inbox (and spam).");
      setCanFillOtp(true);
      setCooldown(60);
    } finally {
      setSendingOtp(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || !isEmailValid) return;
    try {
      setSendingOtp(true);
      setError("");
      await requestPasswordReset(email);
      setNotice("We’ve resent the OTP. Please check your inbox (and spam).");
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend the OTP right now.");
      setNotice("We’ve resent the OTP. Please check your inbox (and spam).");
      setCooldown(60);
    } finally {
      setSendingOtp(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!canFillOtp) return; // ยังไม่ได้ส่ง OTP
    if (!isOtpValid || !isPasswordValid || !isMatch) return;

    try {
      setSubmitting(true);
      setError("");
      await confirmPasswordReset(email, otp.trim(), pwd);
      setNotice("Password has been reset. You can now log in with your new password.");
      // เคลียร์ sensitive fields
      setOtp("");
      setPwd("");
      setPwd2("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <section className="relative w-full min-h-[70vh]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
            <div className="mx-auto max-w-xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
              <div className="px-6 pt-6 pb-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Forgot Password
                </h1>
              </div>

              {/* notices */}
              {notice && (
                <div className="px-6">
                  <p className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-md px-3 py-2">
                    {notice}
                  </p>
                </div>
              )}
              {error && (
                <div className="px-6 pt-3">
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </p>
                </div>
              )}

              <div className="px-6 pb-6">
                {/* กล่อง Email + Send OTP */}
                <form onSubmit={onSendOtp} className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Email</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={!isEmailValid || sendingOtp}
                      className="rounded-md bg-slate-800 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-900 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingOtp ? "Sending..." : "Send OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={onResend}
                      disabled={!canFillOtp || cooldown > 0 || sendingOtp}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="my-5 h-px w-full bg-slate-200" />

                {/* กล่อง OTP + New Password + Confirm */}
                <form onSubmit={onReset} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-sm text-slate-700">OTP</span>
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        disabled={!canFillOtp}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 tracking-widest disabled:bg-slate-50"
                      />
                      {canFillOtp && otp.length > 0 && !isOtpValid && (
                        <p className="mt-1 text-xs text-red-600">OTP must be at least 6 digits.</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm text-slate-700">New password</span>
                      <input
                        type="password"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        placeholder="Minimum 12 characters"
                        disabled={!canFillOtp}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
                      />
                      {canFillOtp && pwd.length > 0 && !isPasswordValid && (
                        <p className="mt-1 text-xs text-red-600">Use at least 12 characters.</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm text-slate-700">Confirm new password</span>
                      <input
                        type="password"
                        value={pwd2}
                        onChange={(e) => setPwd2(e.target.value)}
                        placeholder="Re-type your password"
                        disabled={!canFillOtp}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
                      />
                      {canFillOtp && pwd2.length > 0 && !isMatch && (
                        <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                      )}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!canFillOtp || !isOtpValid || !isPasswordValid || !isMatch || submitting}
                    className="mt-1 w-full rounded-md bg-slate-800 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-900 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Resetting..." : "Reset Password"}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-sm">
                    <Link to="/login" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
                      Back to Log In
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

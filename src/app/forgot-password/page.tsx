"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

function getChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[@$!%*?&._-]/.test(pw),
  };
}
function isStrong(pw: string) {
  const c = getChecks(pw);
  return c.length && c.upper && c.lower && c.number && c.special;
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (idx: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    while (arr.length < 6) arr.push("");
    arr[idx] = d;
    const nv = arr.join("").slice(0, 6);
    onChange(nv);
    if (d && idx < 5) refs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length) { e.preventDefault(); onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }
  };
  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={value[i] || ""} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} className="h-12 w-11 rounded-xl border border-gray-300 bg-white text-center text-lg font-bold tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-12" />
      ))}
    </div>
  );
}

export default function PatientForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { if (resendIn <= 0) return; const t = setTimeout(() => setResendIn(v => v - 1), 1000); return () => clearTimeout(t); }, [resendIn]);
  const checks = getChecks(newPassword);
  const match = newPassword && confirmPassword && newPassword === confirmPassword;
  const canReset = otp.length === 6 && isStrong(newPassword) && match;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/patients/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send code");
      setSuccess(data.message || "Code sent to your email.");
      setStep("otp"); setResendIn(60);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (otp.length !== 6) { setError("Enter 6-digit code."); return; }
    if (!isStrong(newPassword)) { setError("Password must meet strength requirements."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/patients/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), otp, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset");
      setSuccess(data.message || "Password reset successfully."); setTimeout(() => window.location.href = "/login", 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/patients/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || "Failed"); setSuccess(data.message || "Code resent."); setResendIn(60);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 pt-12">
      <div className="mx-auto max-w-lg px-4">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to sign in
        </Link>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">🔑</div>
            <h1 className="text-2xl font-bold text-gray-900">{step === "email" ? "Reset your password" : "Enter verification code"}</h1>
            <p className="mt-1 text-sm text-gray-500">{step === "email" ? "We’ll send a 6-digit code to your email to verify it’s you." : <>Code sent to <span className="font-semibold text-gray-900">{email}</span>. Expires in 10 minutes.</>}</p>
          </div>

          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

          {step === "email" ? (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1aaa] py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60">
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Sending code...</> : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">6-digit code</label>
                <OtpInput value={otp} onChange={setOtp} />
                <div className="mt-3 flex items-center justify-between">
                  <button type="button" onClick={() => setStep("email")} className="text-xs font-medium text-gray-500 hover:text-indigo-600">Change email</button>
                  <button type="button" onClick={handleResend} disabled={resendIn > 0 || loading} className="text-xs font-semibold text-indigo-700 hover:underline disabled:text-gray-400">{resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}</button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600">{showPw ? "Hide" : "Show"}</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[
                    { ok: checks.length, label: "8+ characters" },
                    { ok: checks.upper, label: "Uppercase" },
                    { ok: checks.lower, label: "Lowercase" },
                    { ok: checks.number, label: "Number" },
                    { ok: checks.special, label: "Special char" },
                  ].map(c => (
                    <span key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? "text-emerald-600" : "text-gray-400"}`}>
                      <span className={`flex h-3 w-3 items-center justify-center rounded-full text-[10px] ${c.ok ? "bg-emerald-100" : "bg-gray-100"}`}>{c.ok ? "✓" : "×"}</span> {c.label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Confirm new password</label>
                <input type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                {confirmPassword && <p className={`mt-1 text-xs ${match ? "text-emerald-600" : "text-red-600"}`}>{match ? "Passwords match" : "Passwords do not match"}</p>}
              </div>

              <button type="submit" disabled={loading || !canReset} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1aaa] py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60">
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Resetting...</> : "Reset password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">Remembered? <Link href="/login" className="font-semibold text-indigo-700 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}

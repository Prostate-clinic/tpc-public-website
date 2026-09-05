"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";

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

function PatientResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"validating" | "valid" | "invalid">("validating");
  const [validateMessage, setValidateMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!email || !token) {
        setStatus("invalid");
        setValidateMessage("This reset link is invalid. Please request a new one.");
        return;
      }
      try {
        const res = await fetch("/api/patients/forgot-password/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.valid) setStatus("valid");
        else {
          setStatus("invalid");
          setValidateMessage(data.message || "This reset link is invalid. Please request a new one.");
        }
      } catch {
        if (cancelled) return;
        setStatus("invalid");
        setValidateMessage("This reset link is invalid. Please request a new one.");
      }
    })();
    return () => { cancelled = true; };
  }, [email, token]);

  const checks = getChecks(newPassword);
  const match = newPassword && confirmPassword && newPassword === confirmPassword;
  const canReset = isStrong(newPassword) && match;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isStrong(newPassword)) { setError("Password must meet strength requirements."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/patients/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset");
      setSuccess(data.message || "Password reset successfully.");
      setTimeout(() => { window.location.href = "/login"; }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={
        email ? <>Resetting the password for <span className="font-semibold text-gray-900">{email}</span>.</> : "Choose a strong password to continue."
      }
      icon={
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-2l4.257-4.257A6 6 0 1119 9z" />
        </svg>
      }
      footer={
        <>
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-white underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      {status === "validating" && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#1a1aaa]" /> Checking reset link...
        </div>
      )}

      {status === "invalid" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{validateMessage}</div>
      )}

      {status === "valid" && (
        <>
          {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-[#1a1aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1aaa]/20" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#1a1aaa]">{showPw ? "Hide" : "Show"}</button>
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
              <input type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1a1aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1aaa]/20" />
              {confirmPassword && <p className={`mt-1 text-xs ${match ? "text-emerald-600" : "text-red-600"}`}>{match ? "Passwords match" : "Passwords do not match"}</p>}
            </div>

            <button type="submit" disabled={loading || !canReset} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1a1aaa] py-3 text-sm font-semibold text-white hover:bg-[#111188] disabled:opacity-60">
              {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Resetting...</> : "Save new password"}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default function PatientResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0f3a]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1aaa] border-t-transparent" />
        </div>
      }
    >
      <PatientResetPasswordPageInner />
    </Suspense>
  );
}
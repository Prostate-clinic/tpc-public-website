"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";

function PatientForgotPasswordPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/patients/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset link");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent
          ? <>If an account exists for <span className="font-semibold text-gray-900">{email}</span>, a reset link is on its way. It expires in 20 minutes.</>
          : "We'll email you a secure reset link. It expires in 20 minutes."
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
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {sent ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-emerald-800">
            Open the link we sent to <span className="font-semibold">{email}</span> to choose a new password.
          </p>
          <button type="button" onClick={() => setSent(false)} className="mt-4 text-xs font-semibold text-[#1a1aaa] hover:underline">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1a1aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1aaa]/20"
            />
          </div>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1a1aaa] py-3 text-sm font-semibold text-white hover:bg-[#111188] disabled:opacity-60">
            {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> Sending link...</> : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default function PatientForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0f3a]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1aaa] border-t-transparent" />
        </div>
      }
    >
      <PatientForgotPasswordPageInner />
    </Suspense>
  );
}
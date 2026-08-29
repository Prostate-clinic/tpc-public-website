"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { usePatientAuth } from "@/contexts/PatientAuthContext";
import PasswordInput from "@/components/PasswordInput";
import { AuthLayout } from "@/components/AuthLayout";

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = usePatientAuth();

    const redirectTo = searchParams.get("redirect") || "/patient-portal";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/patients/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Invalid email or password.");
                return;
            }

            login(data.access_token, data.patient);
            router.push(redirectTo);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your patient account to manage appointments and payments."
            icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            }
            footer={
                <>
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="font-semibold text-white underline underline-offset-2">
                        Create one
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition focus:border-[#1a1aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1aaa]/20"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                    <PasswordInput
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition focus:border-[#1a1aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1aaa]/20"
                    />
                </div>

                {error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1a1aaa] py-3 text-sm font-semibold text-white transition hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    )}
                    {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="pt-1 text-center">
                    <Link
                        href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                        className="text-sm font-medium text-[#1a1aaa] hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#0b0f3a]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1aaa] border-t-transparent" />
                </div>
            }
        >
            <LoginPageInner />
        </Suspense>
    );
}

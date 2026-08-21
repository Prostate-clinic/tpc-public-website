"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePatientAuth } from "@/contexts/PatientAuthContext";

type Step = "register" | "verify" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = usePatientAuth();

  const [step, setStep] = useState<Step>("register");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  // Registration form fields
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    lga: "",
    age: "",
    gender: "MALE",
  });

  // OTP form
  const [otp, setOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<string | null>(null);

  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      if (key === "password" || key === "confirmPassword") {
        delete next.password;
        delete next.confirmPassword;
      }
      return next;
    });
  };

  const validateRegisterForm = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Enter at least 2 characters.";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    }
    if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.password = "Passwords do not match.";
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!form.age || Number.parseInt(form.age, 10) < 1) {
      nextErrors.age = "Enter a valid age.";
    }
    if (!form.lga.trim()) {
      nextErrors.lga = "LGA is required.";
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      nextErrors.address = "Enter a valid address.";
    }

    return nextErrors;
  };

  const getInputClassName = (hasError: boolean) => {
    return `w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-1 ${
      hasError
        ? "border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
    }`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nextErrors = validateRegisterForm();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/patients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          address: form.address,
          lga: form.lga,
          age: parseInt(form.age),
          gender: form.gender,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Registration failed. Please try again.");
        return;
      }
      setOtpExpiry(data.otpExpiresAt ?? null);
      setStep("verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patients/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "OTP verification failed. Please check the code and try again.");
        return;
      }

      // Auto-login after verification
      const loginRes = await fetch("/api/patients/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        login(loginData.access_token, loginData.patient);
      }

      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 pt-12">
      <div className="mx-auto max-w-lg px-4">
        {/* Back link */}
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-sm">
          {/* Logo / brand */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Create Patient Account</h1>
            <p className="mt-1 text-sm text-gray-500">Imo Robotics and Oncology Center Patient Portal</p>
          </div>

          {/* Step indicator */}
          <div className="mb-8 flex items-center justify-center gap-3">
            {(["register", "verify", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === s ? "bg-[#1a1aaa] text-white" : i < ["register", "verify", "done"].indexOf(step) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i < ["register", "verify", "done"].indexOf(step) ? "✓" : i + 1}
                </div>
                {i < 2 && <div className="h-px w-8 bg-gray-200" />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Registration form ── */}
          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="John Doe"
                    aria-invalid={Boolean(fieldErrors.name)}
                    className={getInputClassName(Boolean(fieldErrors.name))}
                  />
                  {fieldErrors.name && <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    className={getInputClassName(Boolean(fieldErrors.email))}
                  />
                  {fieldErrors.email && <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder="Min. 6 characters"
                    aria-invalid={Boolean(fieldErrors.password || passwordsMismatch)}
                    className={getInputClassName(Boolean(fieldErrors.password || passwordsMismatch))}
                  />
                  {fieldErrors.password && <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.password}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
                    placeholder="Repeat password"
                    aria-invalid={Boolean(fieldErrors.confirmPassword || passwordsMismatch)}
                    className={getInputClassName(Boolean(fieldErrors.confirmPassword || passwordsMismatch))}
                  />
                  {(fieldErrors.confirmPassword || passwordsMismatch) && (
                    <p className="mt-1 text-sm font-medium text-red-600">
                      {fieldErrors.confirmPassword ?? "Passwords do not match."}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+2348012345678"
                    className={getInputClassName(false)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Age *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.age}
                    onChange={(e) => setField("age", e.target.value)}
                    placeholder="e.g. 34"
                    aria-invalid={Boolean(fieldErrors.age)}
                    className={getInputClassName(Boolean(fieldErrors.age))}
                  />
                  {fieldErrors.age && <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.age}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Gender *</label>
                  <select
                    required
                    value={form.gender}
                    onChange={(e) => setField("gender", e.target.value)}
                    className={getInputClassName(false)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">LGA *</label>
                  <input
                    type="text"
                    required
                    value={form.lga}
                    onChange={(e) => setField("lga", e.target.value)}
                    placeholder="e.g. Owerri Municipal"
                    aria-invalid={Boolean(fieldErrors.lga)}
                    className={getInputClassName(Boolean(fieldErrors.lga))}
                  />
                  {fieldErrors.lga && <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.lga}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Address *</label>
                <input
                  type="text"
                  required
                  minLength={5}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="12 Hospital Road, Owerri"
                  aria-invalid={Boolean(fieldErrors.address)}
                  className={getInputClassName(Boolean(fieldErrors.address))}
                />
                {fieldErrors.address && <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.address}</p>}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a1aaa] py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
                )}
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="rounded-xl bg-indigo-50 p-4 text-center">
                <p className="text-sm font-medium text-indigo-800">
                  A 6-digit verification code has been sent to
                </p>
                <p className="mt-0.5 font-semibold text-indigo-900">{form.email}</p>
                {otpExpiry && (
                  <p className="mt-1 text-xs text-indigo-600">
                    Code expires at {new Date(otpExpiry).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Enter OTP code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl font-bold tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full rounded-lg bg-[#1a1aaa] py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify Email"}
              </button>

              <button
                type="button"
                onClick={() => setStep("register")}
                className="w-full text-center text-sm text-gray-500 hover:text-indigo-700"
              >
                Wrong email? Go back
              </button>
            </form>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Account Created!</h2>
              <p className="mt-2 text-sm text-gray-500">
                Your email has been verified. You&apos;re now logged in to the patient portal.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => router.push("/appointment")}
                  className="w-full rounded-lg bg-[#1a1aaa] py-3 text-sm font-semibold text-white transition hover:bg-indigo-800"
                >
                  Book an Appointment
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Go to Home
                </button>
              </div>
            </div>
          )}

          {step === "register" && (
            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/")}
                className="font-semibold text-indigo-700 hover:underline"
              >
                Sign in from the header
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { usePatientAuth } from "@/contexts/PatientAuthContext";

type PortalAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  doctor?: { id?: string; name?: string };
  service?: { id?: string; name?: string };
  payment?: { id?: string; status?: string; amount?: string };
};

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatCurrency(amount?: string) {
  const numericValue = Number(amount);
  if (!Number.isFinite(numericValue)) return amount || "N/A";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export default function PatientPortalPage() {
  const { patient, token, logout } = usePatientAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section =
    searchParams.get("section") === "book"
      ? "book"
      : searchParams.get("section") === "payments"
        ? "payments"
        : "history";

  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const paymentEntries = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.payment)
      .map((appointment) => ({
        id: appointment.payment?.id || appointment.id,
        date: appointment.date,
        serviceName: appointment.service?.name || "Not available",
        doctorName: appointment.doctor?.name || "Not assigned",
        amount: appointment.payment?.amount,
        status: appointment.payment?.status || "N/A",
      }));
  }, [appointments]);

  const completedPayments = paymentEntries.filter((payment) => payment.status === "COMPLETED").length;

  useEffect(() => {
    if (!patient || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/patients/me/appointments", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load your portal data.");
        }

        if (!cancelled) {
          const nextAppointments = Array.isArray(data?.appointments)
            ? data.appointments
            : Array.isArray(data?.patient?.appointments)
              ? data.patient.appointments
              : [];

          setAppointments(nextAppointments);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your portal data.");
          setAppointments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [patient, token]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        {!patient || !token ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Patient Portal</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Sign in required</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Please sign in from the header to access your portal, appointment history, and booking tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]">
                Go Home
              </Link>
              <Link href="/register" className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Create Account
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:self-start">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Patient Portal</p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back, {patient.name.split(" ")[0]}</h1>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Track appointments, monitor payments, and continue booking from one secure dashboard.
                </p>
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{patient.name}</p>
                  <p className="mt-1 break-all">{patient.email}</p>
                  <p className="mt-1">{patient.phone || "Phone not provided"}</p>
                </div>

                <nav className="mt-6 space-y-2">
                  <Link
                    href="/patient-portal?section=history"
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      section === "history"
                        ? "bg-[#1a1aaa] text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Appointment History
                  </Link>
                  <Link
                    href="/patient-portal?section=payments"
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      section === "payments"
                        ? "bg-[#1a1aaa] text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Payment History
                  </Link>
                  <Link
                    href="/patient-portal?section=book"
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      section === "book"
                        ? "bg-[#1a1aaa] text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Book Appointment
                  </Link>
                </nav>

                <button
                  onClick={handleLogout}
                  className="mt-6 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Sign out
                </button>
              </aside>

              <div className="space-y-8">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{appointments.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payments</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{paymentEntries.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Completed</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{completedPayments}</p>
                    </div>
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                      {section === "payments" ? "Payments" : section === "book" ? "Booking" : "Appointments"}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                      {section === "payments"
                        ? "Your payment history"
                        : section === "book"
                          ? "Continue to appointment booking"
                          : "Your appointment history"}
                    </h2>
                  </div>
                  {loading && (
                    <span className="inline-flex items-center" aria-label="Loading appointments">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-700" aria-hidden="true" />
                    </span>
                  )}
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {!error && !loading && appointments.length === 0 && (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    No appointments found yet. When you complete a booking, it will appear here.
                  </div>
                )}

                {section === "history" && (
                  <div className="mt-6 space-y-4">
                    {appointments.map((appointment) => (
                      <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{formatDate(appointment.date)}</p>
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {appointment.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">Doctor: {appointment.doctor?.name || "Not assigned"}</p>
                        <p className="mt-1 text-sm text-slate-700">Service: {appointment.service?.name || "Not available"}</p>
                        <p className="mt-1 text-sm text-slate-700">
                          Payment: {appointment.payment?.status || "N/A"}
                          {appointment.payment?.amount ? ` (${formatCurrency(appointment.payment.amount)})` : ""}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                {section === "payments" && (
                  <div className="mt-6 space-y-4">
                    {!loading && paymentEntries.length === 0 && !error && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                        No payment records found yet.
                      </div>
                    )}

                    {paymentEntries.map((payment) => (
                      <article key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{payment.serviceName}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatDate(payment.date)}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : payment.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700"}`}>
                            {payment.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">Doctor: {payment.doctorName}</p>
                        <p className="mt-1 text-sm text-slate-700">Amount: {formatCurrency(payment.amount)}</p>
                      </article>
                    ))}
                  </div>
                )}

                {section === "book" && (
                  <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                    <p className="text-sm leading-7 text-indigo-900">
                      Continue with a new appointment using the guided booking flow. Your patient account stays linked, so new appointments and payments appear in this portal automatically.
                    </p>
                    <Link
                      href="/appointment"
                      className="mt-5 inline-flex rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                    >
                      Open Booking Flow
                    </Link>
                  </div>
                )}
                </article>
              </div>
            </section>
          </>
        )}
      </main>

      {/* <GlobalFooter /> */}
    </div>
  );
}

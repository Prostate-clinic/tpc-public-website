"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { usePatientAuth } from "@/contexts/PatientAuthContext";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW";

type PortalAppointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  expiresAt?: string | null;
  notes?: string | null;
  doctor?: { id?: string; name?: string; specialty?: string } | null;
  consultationType?: { id?: string; name?: string; durationMinutes?: number; fee?: string | number } | null;
  branch?: { id?: string; name?: string; timezone?: string } | null;
  payment?: { id?: string; status?: string; amount?: string } | null;
};

/** Every status the engine can produce. `CLOSED` is gone. */
const STATUS_STYLES: Record<AppointmentStatus, { label: string; className: string; hint?: string }> = {
  PENDING: {
    label: "Awaiting payment",
    className: "bg-amber-100 text-amber-800",
    hint: "This time is held for a short while only.",
  },
  CONFIRMED: { label: "Confirmed", className: "bg-emerald-100 text-emerald-700" },
  CHECKED_IN: { label: "Checked in", className: "bg-sky-100 text-sky-700" },
  IN_PROGRESS: { label: "In progress", className: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "Completed", className: "bg-slate-200 text-slate-700" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-200 text-slate-600" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
  NO_SHOW: { label: "Missed", className: "bg-red-100 text-red-700" },
};

/** Statuses a patient may still cancel. IN_PROGRESS deliberately cannot be. */
const CANCELLABLE: ReadonlySet<AppointmentStatus> = new Set<AppointmentStatus>(["PENDING", "CONFIRMED"]);

const UPCOMING: ReadonlySet<AppointmentStatus> = new Set<AppointmentStatus>([
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
]);

/**
 * Appointments are instants; they are rendered in the CLINIC's timezone, not the
 * browser's. A patient checking their booking from London must still see the
 * Lagos time they are expected to turn up at.
 */
function formatDate(iso: string, timeZone?: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    timeZone: timeZone || undefined,
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string, timeZone?: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    timeZone: timeZone || undefined,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatCurrency(amount?: string | number) {
  const numericValue = Number(amount);
  if (!Number.isFinite(numericValue)) return typeof amount === "string" ? amount : "N/A";
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

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const paymentEntries = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.payment)
      .map((appointment) => ({
        id: appointment.payment?.id || appointment.id,
        startAt: appointment.startAt,
        timezone: appointment.branch?.timezone,
        title: appointment.consultationType?.name || "Consultation",
        doctorName: appointment.doctor?.name || "Not assigned",
        amount: appointment.payment?.amount,
        status: appointment.payment?.status || "N/A",
      }));
  }, [appointments]);

  const completedPayments = paymentEntries.filter((payment) => payment.status === "COMPLETED").length;
  const upcomingCount = appointments.filter((appointment) => UPCOMING.has(appointment.status)).length;

  const loadAppointments = useCallback(async () => {
    if (!patient || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/appointments/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load your portal data.");
      }

      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load your portal data.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [patient, token]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const submitCancel = async (id: string) => {
    if (cancelBusy) return;

    setCancelBusy(true);
    setCancelError("");

    try {
      const response = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason.trim() || undefined }),
      });
      const data = await response.json();

      if (!response.ok) {
        // The 24-hour rule is a clinic policy, not a failure. Say what to do next.
        if (data?.code === "CANCELLATION_WINDOW_CLOSED") {
          throw new Error(
            "Appointments can't be cancelled online within 24 hours of the start time. Please call the clinic and we'll sort it out.",
          );
        }
        throw new Error(data?.message || "Unable to cancel this appointment.");
      }

      setCancellingId(null);
      setCancelReason("");
      await loadAppointments();
    } catch (requestError) {
      setCancelError(requestError instanceof Error ? requestError.message : "Unable to cancel this appointment.");
    } finally {
      setCancelBusy(false);
    }
  };

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
              Sign in to access your portal, appointment history, and booking tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?signin=1"
                className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Create Account
              </Link>
            </div>
          </section>
        ) : (
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
                {[
                  { id: "history", href: "/patient-portal?section=history", label: "Appointment History" },
                  { id: "payments", href: "/patient-portal?section=payments", label: "Payment History" },
                  { id: "book", href: "/patient-portal?section=book", label: "Book Appointment" },
                ].map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      section === item.id
                        ? "bg-[#1a1aaa] text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{upcomingCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{appointments.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payments made</p>
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
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-700"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {section === "history" && (
                  <div className="mt-6 space-y-4">
                    {!loading && !error && appointments.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                        No appointments found yet. When you complete a booking, it will appear here.
                      </div>
                    )}

                    {appointments.map((appointment) => {
                      const timezone = appointment.branch?.timezone;
                      const badge = STATUS_STYLES[appointment.status] ?? {
                        label: appointment.status,
                        className: "bg-slate-200 text-slate-700",
                      };
                      const isCancelling = cancellingId === appointment.id;

                      return (
                        <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDate(appointment.startAt, timezone)}
                            </p>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-600">
                            {formatTime(appointment.startAt, timezone)} – {formatTime(appointment.endAt, timezone)}
                            {timezone ? ` (${timezone})` : ""}
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            Doctor: {appointment.doctor?.name || "Not assigned"}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            Consultation: {appointment.consultationType?.name || "Not available"}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            Payment: {appointment.payment?.status || "Not paid"}
                            {appointment.payment?.amount ? ` (${formatCurrency(appointment.payment.amount)})` : ""}
                          </p>

                          {badge.hint && appointment.status === "PENDING" && (
                            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{badge.hint}</p>
                          )}

                          {CANCELLABLE.has(appointment.status) && !isCancelling && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingId(appointment.id);
                                setCancelReason("");
                                setCancelError("");
                              }}
                              className="mt-3 rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Cancel appointment
                            </button>
                          )}

                          {isCancelling && (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                              <label className="grid gap-1 text-xs">
                                <span className="font-semibold text-slate-700">Reason (optional)</span>
                                <textarea
                                  value={cancelReason}
                                  onChange={(event) => setCancelReason(event.target.value)}
                                  maxLength={500}
                                  className="min-h-16 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-300 focus:ring"
                                  placeholder="Let the clinic know why"
                                />
                              </label>

                              {cancelError && (
                                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{cancelError}</p>
                              )}

                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => submitCancel(appointment.id)}
                                  disabled={cancelBusy}
                                  className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                  {cancelBusy ? "Cancelling..." : "Confirm cancellation"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancellingId(null);
                                    setCancelError("");
                                  }}
                                  disabled={cancelBusy}
                                  className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Keep it
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
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
                            <p className="text-sm font-semibold text-slate-900">{payment.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(payment.startAt, payment.timezone)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              payment.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : payment.status === "PENDING"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-200 text-slate-700"
                            }`}
                          >
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
                      Continue with a new appointment using the guided booking flow. Your patient account stays linked,
                      so new appointments and payments appear in this portal automatically.
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
        )}
      </main>
    </div>
  );
}

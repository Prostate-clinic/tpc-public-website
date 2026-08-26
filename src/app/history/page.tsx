"use client";

import { FormEvent, useState } from "react";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import PasswordInput from "@/components/PasswordInput";

type HistoryAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  doctor?: { id: string; name: string };
  service?: { id: string; name: string };
  payment?: { id: string; status: string; amount: string };
};

type PatientHistoryResponse = {
  patient: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    createdAt: string;
    appointments: HistoryAppointment[];
  };
};

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function HistoryPage() {
  const [patientId, setPatientId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PatientHistoryResponse | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId.trim() || !password.trim()) {
      setError("Patient ID and password are required.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/patients/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patientId.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Unable to fetch booking history.");
      }

      setResult(data as PatientHistoryResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to fetch booking history.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Patient Portal</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">View Booking History</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Enter your patient ID and password to securely view previous and upcoming appointments.
          </p>

          <form onSubmit={onSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Patient ID</span>
              <input
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                type="text"
                placeholder="e.g. clx123..."
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Password</span>
              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your booking password"
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Checking..." : "Check History"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {result && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">{result.patient.name}</h2>
            <p className="mt-1 text-sm text-slate-600">Patient ID: {result.patient.id}</p>
            <p className="mt-1 text-sm text-slate-600">Email: {result.patient.email || "Not provided"}</p>
            <p className="mt-1 text-sm text-slate-600">Phone: {result.patient.phone || "Not provided"}</p>

            <div className="mt-6 space-y-4">
              {result.patient.appointments.map((appointment) => (
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
                    {appointment.payment?.amount ? ` (${appointment.payment.amount})` : ""}
                  </p>
                </article>
              ))}

              {result.patient.appointments.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
                  No appointments found for this patient yet.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}

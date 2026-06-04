"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RecoveryCta } from "@/components/RecoveryCta";

const DOCTOR_FALLBACK_IMAGE = "/No-Image-Placeholder%20(2).svg";
const SIRV_BASE_URL = "https://s3.sirv.com";

type ApiDoctor = {
  id: string;
  name?: string | null;
  specialty: string;
  bio?: string | null;
  image?: string | null;
  status?: string | null;
  user?: {
    name?: string | null;
  } | null;
  slots?: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
  }>;
};

function formatAvailability(slots?: ApiDoctor["slots"]) {
  if (!Array.isArray(slots) || slots.length === 0) {
    return "Availability not published";
  }

  const nextSlot = slots.find((slot) => !slot.isBooked) ?? slots[0];
  const date = new Date(nextSlot.date);

  if (Number.isNaN(date.getTime())) {
    return "Availability not published";
  }

  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${label} • ${nextSlot.startTime} - ${nextSlot.endTime}`;
}

function normalizeDoctorImage(image?: string | null) {
  if (!image) return DOCTOR_FALLBACK_IMAGE;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `${SIRV_BASE_URL}/${image}`;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/doctors", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load specialists right now.");
        }

        const payload = await response.json();
        const records = Array.isArray(payload?.doctors) ? payload.doctors : [];

        if (isMounted) {
          setDoctors(records);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load specialists right now.");
          setDoctors([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-100 text-slate-900">
      <Header />

      <main>
        <section className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:px-6 md:pb-24 lg:px-8 h-[70vh]">
          <Image
            src="/robots-img.png"
            alt="Doctors care background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-slate-900/50" />
          <div className="relative mx-auto max-w-6xl text-center">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
                Specialist Expertise,
              <br />
                Compassionate Precision,
              <br />
                Better Outcomes.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl leading-7 text-slate-200">
                Meet the clinicians, surgeons, and care teams delivering advanced urologic treatment through collaborative,
                evidence-led care tailored to every patient journey.
            </p>
            <button className="mt-8 rounded-full bg-[#1a1aaa] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/25 transition hover:-translate-y-0.5 hover:bg-[#111188]">
              Book Appointment
            </button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="text-center text-5xl font-bold tracking-tight">Our team</h2>
          <p className="mt-3 text-center text-slate-600">Meet Our Specialists</p>

          {loading && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Loading specialists...
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <article key={doctor.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-fit">
                  <Image
                    src={normalizeDoctorImage(doctor.image)}
                    alt={`${doctor.name} cover`}
                    height={800}
                    width={800}
                    className="h-[40vmin] object-cover object-[0%_0%]"
                  />
                </div>

                <div className="relative px-5 pb-5 pt-8 text-center"> 
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-2xl font-bold">{doctor.name || doctor.user?.name || "Specialist"}</h3>
                    {doctor.status && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${doctor.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {doctor.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{doctor.specialty}</p>
                  <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-slate-600">
                    {doctor.bio || "Experienced specialist delivering evidence-based urologic care with a patient-first approach."}
                  </p>

                  <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {formatAvailability(doctor.slots)}
                  </p>

                  <button className="mt-6 w-full rounded-full bg-[#1a1aaa] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#111188]">
                    View profile
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!loading && doctors.length === 0 && !error && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No specialists available right now.
            </div>
          )}
        </section>

        <RecoveryCta description="Connect with our clinical experts today for a personalized assessment and discover the benefits of precision robotic healthcare." />
      </main>

      <GlobalFooter />
    </div>
  );
}

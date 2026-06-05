"use client";

import Image from "next/image";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RecoveryCta } from "@/components/RecoveryCta";

const PLACEHOLDER_SRC = "/No-Image-Placeholder%20(2).svg";

type DepartmentCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  full?: boolean;
  image: string;
};

type DepartmentGroup = {
  id: string;
  title: string;
  cards: DepartmentCard[];
};

export default function DepartmentsPage() {
  const groups: DepartmentGroup[] = [
    {
      id: "administrative",
      title: "Administrative & Coordination",
      cards: [
        {
          id: "administrative-main",
          title: "Administrative Department",
          description:
            "The backbone of our clinical operations, managing workflow, governance, and strategic service delivery.",
          icon: "AD",
          image:"/departments/admin.png"
        },
        {
          id: "patient-coordination",
          title: "Patient Coordination",
          description:
            "A dedicated concierge service guiding every patient through assessment, treatment, and long-term follow-up.",
          icon: "PC",
          image: "/departments/patientGuidance.png"
        },
      ],
    },
    {
      id: "outpatient",
      title: "Clinical & Patient Care",
      cards: [
        {
          id: "outpatient-care",
          title: "Outpatient Department",
          description:
            "Efficient consultations and fast-track diagnostics for ambulatory patients requiring specialist review.",
          icon: "OP",
          image: "/departments/outpatient.png"
        },
        {
          id: "inpatient",
          title: "Inpatient Department",
          description:
            "Premium recovery suites with 24/7 monitoring and personalized post-intervention clinical protocols.",
          icon: "IP",
          image: "/departments/inpatient.png"
        },
      ],
    },
    {
      id: "diagnostics",
      title: "Diagnostics & Lab",
      cards: [
        {
          id: "lab-diagnostics",
          title: "Lab & Diagnostics",
          description:
            "Next-generation profiling and AI-assisted imaging designed for early detection and clearer decisions.",
          icon: "LD",
          image: "/Advanced-diagnostics.jpg"
        },
        {
          id: "phlebotomy",
          title: "Phlebotomy",
          description:
            "Advanced sampling and blood analysis workflows supporting oncology and precision-urology pathways.",
          icon: "PH",
          image: "/departments/phlebotomy.png"
        },
      ],
    },
    {
      id: "surgical",
      title: "Surgical & Critical Care",
      cards: [
        {
          id: "surgical-dept",
          title: "Surgical Department",
          description:
            "Robotics-enabled operating protocols built for procedural precision and patient safety from start to finish.",
          icon: "SG",
          image: "/robotic2.jpg"
        },
        {
          id: "anesthesia",
          title: "Anesthesia Department",
          description:
            "Structured anesthesia management with tailored plans, intra-operative monitoring, and recovery support.",
          icon: "AN",
          image: "/departments/anaesthesia.png"
        },
        {
          id: "theatre",
          title: "Theatre Department",
          description:
            "State-of-the-art theatre infrastructure engineered for sterile workflow, precision instrumentation, and efficiency.",
          icon: "TH",
          image: "/departments/theatre.png"
        },
      ],
    },
    {
      id: "pharmacology",
      title: "Pharmacology",
      cards: [
        {
          id: "pharmacology-main",
          title: "Pharmacology Department",
          description:
            "Expert medication management and targeted therapy planning aligned to each patient profile and treatment phase.",
          icon: "RX",
          full: true,
          image: "/departments/pharmacology.png"
        },
      ],
    },
  ];

  const journey = [
    {
      title: "Consultation",
      subtitle: "Initial AI-assisted clinical intake",
      icon: "01",
    },
    {
      title: "Diagnosis",
      subtitle: "Multi-modal digital pathology",
      icon: "02",
    },
    {
      title: "Robotic Treatment",
      subtitle: "High-precision surgical intervention",
      icon: "03",
      featured: true,
    },
    {
      title: "Recovery",
      subtitle: "Data-driven post-op monitoring",
      icon: "04",
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[url('/robots-img.png')] px-5 pb-20 pt-16 sm:px-6 md:pb-24 lg:px-8">
          {/* <Image src='/robots-img.png' alt="Departments hero" fill className="object-cover" priority />*/}
          <div className="absolute z-10 inset-0 bg-slate-900/65" />
          <div className="relative z-20 mx-auto max-w-6xl text-center">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Coordinated Care Across
              <br />
              Specialized Clinical Units
            </h1>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
              Our clinic is structured into dedicated departments that work together seamlessly to deliver accurate
              diagnosis, effective treatment, and exceptional patient care.
            </p>
            <button className="mt-8 rounded-full bg-[#1a1aaa] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 hover:bg-[#111188]">
              Book Appointment
            </button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold sm:text-5xl">Our Departments</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
              Our departments work hand-in-hand to provide coordinated, patient-focused care at every stage of your
              medical journey.
            </p>
          </div>

          <div className="mt-14 space-y-16">
            {groups.map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-28">
                <h3 className="border-l-4 border-indigo-700 pl-3 text-3xl font-bold text-slate-900 sm:text-3xl">
                  {group.title}
                </h3>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {group.cards.map((card) => (
                    <article
                      key={card.id}
                      id={card.id}
                      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        card.full ? "md:col-span-2" : ""
                      }`}
                    >
                      <div className="relative mb-2 h-[50vmin] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        <Image src={card.image} alt={card.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-slate-900/10" />
                      </div>
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-extrabold text-indigo-700">
                        {card.icon}
                      </div>
                      <h4 className="mt-4 text-xl font-bold text-slate-900">{card.title}</h4>
                      <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{card.description}</p>
                      {/* <button className="mt-4 rounded-full bg-[#1a1aaa] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#111188]">
                        Learn More
                      </button> */}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="bg-[#dff0fb56] px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">The Patient Journey</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
                Our integrated approach ensures continuity of care across all departments.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {journey.map((step) => (
                <article key={step.title} className="text-center">
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-sm font-extrabold ${
                      step.featured
                        ? "bg-[#1a1aaa] text-white shadow-lg shadow-indigo-900/25"
                        : "bg-white text-indigo-700"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-56 text-sm leading-6 text-slate-600">{step.subtitle}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <RecoveryCta
          description="Connect with our clinical experts today for a personalized assessment and discover the benefits of precision robotic healthcare."
          sectionClassName="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-24"
        />
      </main>

      <GlobalFooter />
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RecoveryCta } from "@/components/RecoveryCta";

type ApiService = {
  id: string;
  name: string;
  category: "SURGICAL" | "CONSULTATION" | "DIAGNOSTICS" | "IMAGING";
  duration: number | string;
  price: number | string;
  description?: string | null;
  focus?: string[] | null;
};

type DisplayService = {
  id: string;
  category: "surgical" | "consultation" | "diagnostics" | "imaging";
  title: string;
  description: string;
  image: string;
};

const serviceImageMap: Record<string, string> = {
  "Robotic Radical Prostatectomy": "/robotic2.jpg",
  "Robotic Partial Nephrectomy": "/FeM-laparoscopic-nephrectomy.jpg",
  "AI-Assisted Clinical Consultation": "/ai-consulting.jpg",
  "Comprehensive Urology Consultation": "/ai-consulting.jpg",
  "Advanced Prostate Imaging": "/Advanced-diagnostics.jpg",
  "Urology Lab and Marker Diagnostics": "/Advanced-diagnostics.jpg",
  "Precision MRI Imaging Pathway": "/advanced_imaging.jpg",
};

const defaultServiceImage = "/robots-img.png";

function normalizeCategory(category: ApiService["category"]): DisplayService["category"] {
  if (category === "SURGICAL") return "surgical";
  if (category === "CONSULTATION") return "consultation";
  if (category === "DIAGNOSTICS") return "diagnostics";
  return "imaging";
}

export default function Services() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [services, setServices] = useState<DisplayService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const serviceCategories = [
    { id: "all", label: "All Services", icon: "AS" },
    { id: "surgical", label: "Surgical Procedures", icon: "SP" },
    { id: "consultation", label: "Consultation & Assessment", icon: "CA" },
    { id: "diagnostics", label: "Diagnostics", icon: "DX" },
    { id: "imaging", label: "Imaging Services", icon: "IM" },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/services");
        if (!response.ok) {
          throw new Error("Unable to load services right now.");
        }

        const payload = await response.json();
        const records: ApiService[] = Array.isArray(payload?.services) ? payload.services : [];

        const mapped = records.map((service) => ({
          id: service.id,
          category: normalizeCategory(service.category),
          title: service.name,
          description:
            service.description ||
            "Specialist-led care pathway with clinical precision, structured planning, and coordinated recovery support.",
          image: serviceImageMap[service.name] || defaultServiceImage,
        }));

        if (isMounted) {
          setServices(mapped);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load services right now.");
          setServices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const whyChoose = [
    {
      title: "AI-Powered Diagnostics",
      description:
        "Our diagnostic stack combines specialist interpretation and machine-driven pattern detection to reduce uncertainty.",
      icon: "01",
    },
    {
      title: "Next-Gen Robotic Platforms",
      description:
        "From magnified visualization to highly controlled movement, each platform is selected for procedural precision.",
      icon: "02",
    },
    {
      title: "World-Class Surgeons",
      description:
        "Our multidisciplinary team unites deep clinical experience with research-backed innovation and patient-centered care.",
      icon: "03",
    },
  ];

  const displayedServices =
    activeCategory === "all"
      ? services
      : services.filter((service) => service.category === activeCategory);

  return (
    <div className="bg-slate-50 text-slate-900">
      <Header />

      <main className="">
        <section className="relative bg-[#0f172a] px-5 pb-24 pt-14 sm:px-6 md:pb-32 lg:px-8 mb-28 h-[60vh]">
          <Image src="/hero-robots.jpg" alt="Services hero" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-slate-900/70" />
          <div className="absolute mx-auto max-w-6xl left-0 right-0 top-1/2 -translate-y-1/9 px-5">
            <div className="mt-28 mx-auto max-w-3xl rounded-4xl border border-white/20 bg-white/95 backdrop-blur-md p-8 text-center shadow-2xl md:p-10">
              <h2 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl font-[family-name:var(--font-poppins)]">
                Precision Urology.
                <br />
                <span className="text-[#f04438]">Advanced Clinical Excellence.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                Experience specialist-led services powered by AI decision support, advanced imaging, and robotics built for safer recovery.
              </p>
              <div className="mt-7 flex justify-center">
                <Link href="/appointment" className="rounded-full bg-[#1a1aaa] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/25 transition hover:-translate-y-0.5 hover:bg-[#111188]">
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-40">
          <h2 className="mt-3 text-center text-4xl font-bold sm:text-5xl font-[family-name:var(--font-poppins)]">Explore Our Services</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-7 text-slate-600">
            Choose a pathway to view focused clinical services. Each service card outlines how technology and specialists work together.
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-[280px_1fr]">
            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <div className="w-full max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-5 text-xl font-semibold">Our Services</p>
                <div className="flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 lg:block lg:overflow-visible lg:pb-0">
                  {serviceCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-auto shrink-0 snap-start whitespace-nowrap rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition lg:mb-3 lg:w-full lg:whitespace-normal ${activeCategory === category.id
                          ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-100 hover:bg-indigo-50/60"
                        }`}
                    >
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-700">
                        {category.icon}
                      </span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="relative space-y-10 pl-0 lg:pl-8">
              <span className="absolute left-0 top-2 hidden h-[98%] w-0.5 bg-slate-200 lg:block" />
              {loading && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm md:p-8">
                  Loading services...
                </div>
              )}

              {error && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm md:p-8">
                  {error}
                </div>
              )}

              {displayedServices.map((service) => (
                <article
                  key={service.id}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md md:p-8"
                >
                  <span className="absolute -left-8.5 top-10 hidden h-4 w-4 rounded-full border-4 border-white bg-indigo-600 lg:block" />
                  <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900">{service.title}</h3>
                      <p className="mt-4 leading-7 text-slate-600">{service.description}</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/appointment" className="rounded-full bg-[#1a1aaa] px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-800/20 transition hover:-translate-y-0.5 hover:bg-[#111188]">
                          Book Appointment
                        </Link>
                        <Link href="/contact" className="rounded-full border border-indigo-200 bg-white px-6 py-2 text-sm font-semibold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-50">
                          Learn More
                        </Link>
                      </div>
                    </div>

                    <div className="relative h-64 overflow-hidden rounded-3xl">
                      <Image src={service.image} alt={service.title} fill className="object-cover" />
                      <div className="absolute inset-0 bg-slate-900/10" />
                      <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                        <p className="text-sm font-semibold text-slate-700">Technology-enabled workflow</p>
                        <p className="mt-1 text-xs text-slate-500">Planning, precision execution, and structured recovery support.</p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {!loading && displayedServices.length === 0 && !error && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                  No services available in this category yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <h2 className="text-4xl font-bold sm:text-5xl font-[family-name:var(--font-poppins)]">Why Choose Us</h2>
          <p className="mb-12 mt-4 max-w-2xl leading-7 text-slate-600">
            Clinical excellence is built through specialist depth, integrated technology, and consistent care pathways.
          </p>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="relative h-80 overflow-hidden rounded-3xl shadow-sm md:h-108">
              <Image src="/robots-img.png" alt="Why choose us" fill className="object-cover" />
              <div className="absolute inset-0 bg-slate-900/10" />
              <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/70 bg-white/80 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Clinical Promise</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Evidence-led decisions, precision-led procedures.</p>
              </div>
            </div>

            <div className="space-y-5">
              {whyChoose.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-extrabold text-indigo-700">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <RecoveryCta description="Connect with our clinical experts for a personalized assessment and treatment plan tailored to your goals." />
      </main>

      <GlobalFooter />
    </div>
  );
}

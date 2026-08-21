import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { buildBackendUrl } from "@/lib/backend-api";

const services = [
  {
    title: "Multi-specialty consultations",
    description:
      "We offer a full range of specialized medical services designed to diagnose, treat, and manage prostate, kidney and urologic conditions using cutting-edge technology and expert care.",
    bullets: [
      "Personalized medical consultations",
      "Minimally invasive treatment options",
      "Precision-guided robotic surgery",
    ],
    image: "/Group-64.png",
    imageAlt: "Doctor discussing treatment with patient",
  },
  {
    title: "Advanced diagnostics",
    description:
      "Using precise data and modern diagnostic technology, our experts detect abnormalities early, then guide care with clarity and confidence from first test to treatment.",
    bullets: [
      "Advanced scans and lab analysis",
      "Robotic and imaging support",
      "Fast turnaround for clear care plans",
    ],
    image: "/about-img.png",
    imageAlt: "Robotic-assisted procedure setup",
  },
];

async function fetchBlogs() {
  try {
    const url = buildBackendUrl("/blogs?page=1&limit=3");
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.warn(`Blog fetch failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const blogs = Array.isArray(data.blogs) ? data.blogs : [];
    
    if (blogs.length === 0) {
      console.warn("No blogs returned from API");
      return [];
    }

    return blogs.map((blog: any) => ({
      id: blog.id,
      title: blog.title || "Untitled",
      text: blog.excerpt || blog.slug || "",
    }));
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
    return [];
  }
}

export default async function Home() {
  const insights = await fetchBlogs();

  return (
    <div className="bg-[var(--page-bg)] text-[var(--ink)]">
      <Header />

      <main>
        <section className="relative isolate overflow-hidden px-5 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-28">
          <Image src="/hero-robots.jpg" alt="Clinic hero" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
          <div className="relative mx-auto flex min-h-[68vh] w-full max-w-6xl items-center justify-center">
            <div className="text-center">
              <h1 className="mx-auto max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
                Advanced Prostate & Urological Care Powered by AI and Robotics
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
                Delivering world-class diagnosis, treatment, and surgical excellence through cutting-edge technology and expert multidisciplinary care.
              </p>
              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <a
                  href="/appointment"
                  className="rounded-full bg-[#1a1aaa] px-8 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#111188]"
                >
                  Book Appointment
                </a>
                <a
                  href="/services"
                  className="rounded-full border-2 border-[#1a1aaa] bg-white px-8 py-3 text-center text-sm font-semibold text-[#1a1aaa] transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-10 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.17em] text-slate-500">Trusted by patients and care partners</p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm font-bold text-slate-500 sm:grid-cols-3 lg:grid-cols-6">
            <span className="rounded-md border border-slate-200 bg-white py-3">RoboCare</span>
            <span className="rounded-md border border-slate-200 bg-white py-3">MedIntel</span>
            <span className="rounded-md border border-slate-200 bg-white py-3">UroLink</span>
            <span className="rounded-md border border-slate-200 bg-white py-3">ClinOps</span>
            <span className="rounded-md border border-slate-200 bg-white py-3">NovaLab</span>
            <span className="rounded-md border border-slate-200 bg-white py-3">CareFlow</span>
          </div>
        </section>

        <section id="about" className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.17em] text-[var(--primary)]">Who We Are</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A New Standard in AI-Integrated Urology</h2>
            <p className="mt-5 leading-7 text-slate-600">
              Imo Robotics and Oncology Center is a specialist medical institution focused on technology-enhanced prostate and urological
              care. We combine expert clinicians with robotics, clinical data intelligence, and continuous monitoring systems.
            </p>
            <p className="mt-4 leading-7 text-slate-600">
              Our mission is simple: improve confidence in decisions, reduce care variability, and deliver measurable outcomes
              for every patient journey.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xl font-bold">Care Snapshot</p>
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--primary)]/8 p-4">
                <p className="text-3xl font-bold text-[var(--primary)]">97%</p>
                <p className="mt-1 text-sm text-slate-700">Early-detection confidence</p>
              </div>
              <div className="rounded-2xl bg-[var(--primary)]/8 p-4">
                <p className="text-3xl font-bold text-[var(--primary)]">42m</p>
                <p className="mt-1 text-sm text-slate-700">Average digital wait time</p>
              </div>
              <div className="rounded-2xl bg-[var(--primary)]/8 p-4">
                <p className="text-3xl font-bold text-[var(--primary)]">15k+</p>
                <p className="mt-1 text-sm text-slate-700">Clinical cases supported</p>
              </div>
              <div className="rounded-2xl bg-[var(--primary)]/8 p-4">
                <p className="text-3xl font-bold text-[var(--primary)]">24/7</p>
                <p className="mt-1 text-sm text-slate-700">Patient guidance channels</p>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">Explore Our Services</h2>
          <p className="text-center text-[11px] mt-3 font-semibold uppercase tracking-[0.2em] text-slate-500">Advanced specialized services with cutting edge technology</p>

          <div className="relative mt-12 space-y-20">
            <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
              <div className="relative h-56 overflow-hidden rounded-xl sm:h-64">
                <Image
                  src={services[0].image}
                  alt={services[0].imageAlt}
                  fill
                  className="object-cover"
                />
              </div>
              <article>
                <h3 className="text-2xl font-semibold leading-normal text-slate-900 sm:text-[2rem]">{services[0].title}</h3>
                <p className="mt-3 max-w-md text-slate-600 leading-relaxed">{services[0].description}</p>
                <ul className="mt-3 space-y-2 text-[11px] font-semibold text-slate-700">
                  {services[0].bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                      <span className="text-base">{bullet}</span>
                    </li>
                  ))}
                </ul>
                {/* <button className="mt-3 rounded-full bg-[var(--primary)] px-5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                  Learn More
                </button> */}
              </article>
            </div>

            <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
              <article className="md:order-1">
                <h3 className="text-2xl font-semibold leading-normal text-slate-900 sm:text-[2rem]">{services[1].title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">{services[1].description}</p>
                <ul className="mt-3 space-y-2 text-[11px] font-semibold text-slate-700">
                  {services[1].bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                      <span className="text-base">{bullet}</span>
                    </li>
                  ))}
                </ul>
                {/* <button className="mt-3 rounded-full bg-[var(--primary)] px-5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                  Learn More
                </button> */}
              </article>
              <div className="relative h-56 overflow-hidden rounded-xl sm:h-64 md:order-2">
                <Image
                  src={services[1].image}
                  alt={services[1].imageAlt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Link href="/services" className="rounded-full bg-[var(--primary)] px-5 py-1.5 font-semibold uppercase tracking-[0.08em] text-white">
                See all
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Patient Testimonials</h2>
          <p className="mt-3 text-center text-slate-600">Real experiences from people who trusted Imo Robotics and Oncology Center.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              "The team explained every step clearly and the digital updates made my treatment journey less stressful.",
              "From diagnosis to recovery, everything felt coordinated. The robotics team inspired confidence.",
              "Appointments were fast, communication was clear, and the care quality was exceptional.",
            ].map((quote) => (
              <blockquote key={quote} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xl text-[var(--primary)]">★★★★★</p>
                <p className="mt-4 leading-7 text-slate-700">{quote}</p>
                <p className="mt-5 text-sm font-semibold text-slate-500">Verified Patient</p>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="insights" className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.17em] text-[var(--primary)]">Latest Articles</p>
          <h2 className="mt-3 text-center text-3xl font-bold sm:text-4xl">Recent Blog Posts</h2>
          {insights.length === 0 ? (
            <div className="mt-10 text-center text-slate-600">
              <p>No blog posts available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {insights.map((item: any) => (
                <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Blog Post</p>
                  <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
                  <Link
                    href={`/blog/${item.id}`}
                    className="mt-5 inline-block rounded-full border border-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/10"
                  >
                    Read More
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <GlobalFooter id="contact" />
    </div>
  );
}

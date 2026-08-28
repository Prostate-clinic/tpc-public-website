"use client";
import Image from "next/image";
import { Header } from "@/components/Header";
import { useRef, useState, useEffect } from "react";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RecoveryCta } from "@/components/RecoveryCta";
import Link from "next/link";

const PLACEHOLDER_SRC = "/No-Image-Placeholder%20(2).svg";

type ApiBlog = {
    id: string;
    title: string;
    excerpt?: string | null;
    content?: string | null;
    coverImage?: string | null;
    tags?: string[] | null;
};

type InsightCard = {
    id: string;
    category: string;
    title: string;
    description: string;
    img?: string;
};

const fallbackInsights: InsightCard[] = [
    {
        id: "insight-1",
        category: "Health Insights",
        title: "Prostate Health Essentials",
        description:
            "A practical walkthrough of screening windows, symptom patterns, and when to escalate for specialist review.",
        img: "/prostate-health.jpg",
    },
    {
        id: "insight-2",
        category: "Clinical Innovation",
        title: "Transforming Care Through Robotics",
        description:
            "How precision robotics and multidisciplinary planning can lower variability and improve confidence in outcomes.",
    },
    {
        id: "insight-3",
        category: "Recovery Guide",
        title: "Nutrition, Hydration, and Recovery",
        description:
            "Simple daily habits that help patients improve healing, recovery response, and long-term treatment resilience.",
    },
];

function normalizeBlogImage(image?: string | null) {
    if (!image) return PLACEHOLDER_SRC;
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    if (image.startsWith("/")) return image;
    return `/${image}`;
}

function toInsightCards(blogs: ApiBlog[]): InsightCard[] {
    return blogs.map((blog, index) => {
        const fullText = blog.excerpt || blog.content || "";
        const trimmedText = fullText.length > 140 ? `${fullText.slice(0, 137)}...` : fullText;

        return {
            id: blog.id || `insight-${index}`,
            category: blog.tags?.[0] || "Health Insights",
            title: blog.title || "Untitled article",
            description: trimmedText || "Read the latest update from our specialist care team.",
            img: normalizeBlogImage(blog.coverImage),
        };
    });
}

export default function About() {
    const teamMembers = [
        {
            id: "member-1",
            name: "Prof. Kingsley Ekwueme",
            role: "CEO / Medical Director",
            specialty: "Robotic & Urologic Surgery",
            tone: "from-slate-100 via-cyan-50 to-blue-100",
            img:"/prof.png",
            position:"object-[-2px_0px]"
        },
        {
            id: "member-2",
            name: "Blessing Onyekachi",
            role: "Hospital Administrator",
            specialty: "Clinical Operations",
            tone: "from-slate-100 via-indigo-50 to-violet-100",
            img:"/blessing.jpg",
            position:"object-[0px_0px]"
        },
        {
            id: "member-3",
            name: "Joanne Roberts",
            role: "Lead Robotic Assistant",
            specialty: "Procedure Coordination",
            tone: "from-slate-100 via-rose-50 to-orange-100",
            img:"/joanne.jpg",
            position:"object-[0px_-95px]"
        },
        {
            id: "member-4",
            name: "Chioma Egwu Okoh",
            role: "Surgical First Assistant",
            specialty: "Perioperative Safety",
            tone: "from-slate-100 via-emerald-50 to-teal-100",
            img:"/chioma.png",
            position:"object-[0px_-20px]"
        },
    ];

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [insights, setInsights] = useState<InsightCard[]>(fallbackInsights);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [insightsError, setInsightsError] = useState("");

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth - container.clientWidth;
            const progress = scrollWidth > 0 ? (scrollLeft / scrollWidth) * 100 : 0;
            setScrollProgress(progress);

            // Calculate which card is currently active based on scroll position
            const cardWidth = 320; // w-80
            const gap = 24; // gap-6
            const currentIndex = Math.round(scrollLeft / (cardWidth + gap));
            setActiveIndex(Math.min(currentIndex, teamMembers.length - 1));
        };

        container.addEventListener("scroll", handleScroll);
        // Set initial state
        handleScroll();
        return () => container.removeEventListener("scroll", handleScroll);
    }, [teamMembers.length]);

    useEffect(() => {
        let isMounted = true;

        const loadInsights = async () => {
            setInsightsLoading(true);
            setInsightsError("");

            try {
                const response = await fetch("/api/blogs?page=1&limit=3");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || "Unable to load education updates right now.");
                }

                const records: ApiBlog[] = Array.isArray(data?.blogs)
                    ? data.blogs
                    : Array.isArray(data)
                      ? data
                      : [];
                const mapped = toInsightCards(records);

                if (isMounted) {
                    setInsights(mapped.length > 0 ? mapped : fallbackInsights);
                }
            } catch (error) {
                if (isMounted) {
                    setInsightsError(error instanceof Error ? error.message : "Unable to load education updates right now.");
                    setInsights(fallbackInsights);
                }
            } finally {
                if (isMounted) {
                    setInsightsLoading(false);
                }
            }
        };

        loadInsights();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="bg-slate-50 text-slate-900">
            <Header />

            <main>
                <section className="relative isolate overflow-hidden bg-[#0f172a] px-5 pb-24 pt-14 sm:px-6 md:pb-28 lg:px-8">
                    <Image src="/hero-robots.jpg" alt="About hero" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
                    <div className="relative mx-auto max-w-6xl text-center">
                        <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
                            Redefining Specialized Care
                            <br />
                            <span className="text-white/85">Through Innovation and Expertise</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl leading-7 text-slate-300">
                            We combine expert clinicians, advanced diagnostics, and robotics-enabled precision to deliver safer and more
                            consistent outcomes for every patient journey.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <Link href="/appointment" className="rounded-full bg-[#1a1aaa] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 hover:bg-[#111188]">
                                Book Appointment
                            </Link>
                            <Link href="#who-we-are" className="rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>

                <section id="who-we-are" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">Who We Are</p>
                        <h2 className="mt-3 text-4xl font-bold">Clinical Excellence, Intentionally Delivered</h2>
                        <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">
                            The Imo Robotic Surgery and Oncology Center is focused on advanced diagnosis and treatment pathways that combine research, technology,
                            and specialist care teams under one coordinated system.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
                        <div className="space-y-5">
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
                                <p className="mt-3 leading-7 text-slate-600">
                                    Deliver accessible, technology-enabled urologic care with measurable quality and clear communication at
                                    every stage of treatment.
                                </p>
                            </article>
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
                                <p className="mt-3 leading-7 text-slate-600">
                                    Build one of Africa&apos;s most trusted precision-urology institutions by combining expert teams, data,
                                    and robotics-led workflows.
                                </p>
                            </article>
                        </div>

                        <div className="relative h-96 overflow-hidden rounded-4xl shadow-sm">
                            <Image src="/Group-64.png" alt="Clinical focus" height={1580} width={860} className="object-center object-contain" />
                            <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[2px] hover:backdrop-blur-[0px] transition" />
                            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/70 bg-white/80 p-5 backdrop-blur">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Clinical Focus</p>
                                <p className="mt-2 text-lg font-bold text-slate-900">Diagnosis. Precision intervention. Structured recovery.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-20">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">Our Team</p>
                        <h2 className="mt-3 text-4xl font-bold">Meet Our Team</h2>
                        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
                            A multidisciplinary group of surgeons, administrators, and care coordinators committed to patient-centered care.
                        </p>
                    </div>

                    <div className="relative mt-12">
                        {/* Left Arrow */}
                        <button
                            onClick={() => {
                                const container = scrollContainerRef.current;
                                if (container) {
                                    const cardWidth = 320;
                                    const gap = 24;
                                    const currentScroll = container.scrollLeft;
                                    const targetScroll = Math.max(0, currentScroll - (cardWidth + gap));
                                    container.scrollTo({
                                        left: targetScroll,
                                        behavior: "smooth"
                                    });
                                }
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Previous team member"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Right Arrow */}
                        <button
                            onClick={() => {
                                const container = scrollContainerRef.current;
                                if (container) {
                                    const cardWidth = 320;
                                    const gap = 24;
                                    const currentScroll = container.scrollLeft;
                                    const maxScroll = container.scrollWidth - container.clientWidth;
                                    const targetScroll = Math.min(maxScroll, currentScroll + (cardWidth + gap));
                                    container.scrollTo({
                                        left: targetScroll,
                                        behavior: "smooth"
                                    });
                                }
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Next team member"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <div
                            ref={scrollContainerRef}
                            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
                            style={{ 
                                scrollbarWidth: "none",
                                msOverflowStyle: "none"
                            }}
                        >
                            {teamMembers.map((member, index) => (
                                <article
                                    key={member.id}
                                    className="shrink-0 w-80 snap-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="relative h-60">
                                        <Image src={member.img || PLACEHOLDER_SRC} alt={`${member.name} profile`} fill className={`object-cover ${member.position}`} />
                                        <div className="absolute inset-0 bg-slate-900/10" />
                                        <div className="absolute left-5 top-5 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-xs font-semibold text-slate-600">
                                            Team Profile
                                        </div>
                                        <div className="absolute -bottom-6 left-5 h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
                                            <Image src={PLACEHOLDER_SRC} alt={`${member.name} avatar`} fill className="object-cover" />
                                        </div>
                                    </div>
                                    <div className="p-5 pt-8">
                                        <h3 className="text-lg font-extrabold text-slate-900">{member.name}</h3>
                                        <p className="mt-1 text-sm font-semibold text-indigo-700">{member.role}</p>
                                        <p className="mt-1 text-sm text-slate-600">{member.specialty}</p>
                                        <div className="mt-4 flex gap-2 text-xs text-slate-500">
                                            <span className="rounded-full border border-slate-200 px-2 py-1">LinkedIn</span>
                                            <span className="rounded-full border border-slate-200 px-2 py-1">Email</span>
                                            <span className="rounded-full border border-slate-200 px-2 py-1">Profile</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Progress Indicator - Circles */}
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {teamMembers.map((member, index) => {
                                const isActive = activeIndex === index;
                                return (
                                    <button
                                        key={member.id}
                                        onClick={() => {
                                            const container = scrollContainerRef.current;
                                            if (container) {
                                                const cardWidth = 320; // w-80
                                                const gap = 24; // gap-6
                                                container.scrollTo({
                                                    left: index * (cardWidth + gap),
                                                    behavior: "smooth"
                                                });
                                            }
                                        }}
                                        className={`transition-all duration-300 ease-out ${
                                            isActive
                                                ? "w-8 h-2 bg-indigo-600 rounded-full"
                                                : "w-2 h-2 bg-slate-300 rounded-full hover:bg-slate-400"
                                        }`}
                                        aria-label={`Scroll to ${member.name}`}
                                    />
                                );
                            })}
                        </div>
                        <p className="text-center text-xs text-slate-500 mt-3">Use arrows, dots, or swipe to explore our team</p>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-20">
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">Education</p>
                        <h2 className="mt-3 text-4xl font-bold">Health Insights and Patient Education</h2>
                        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">Stay informed with practical updates from our care team.</p>
                    </div>

                    {insightsError && (
                        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {insightsError}
                        </div>
                    )}

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {insightsLoading &&
                            Array.from({ length: 3 }).map((_, index) => (
                                <article
                                    key={`insight-skeleton-${index}`}
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="h-44 animate-pulse bg-slate-200" />
                                    <div className="space-y-3 p-6">
                                        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                                        <div className="h-6 w-full animate-pulse rounded bg-slate-200" />
                                        <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
                                        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                                    </div>
                                </article>
                            ))}

                        {insights.map((item) => (
                            <article
                                key={item.id}
                                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="relative h-44">
                                    <Image src={item.img || PLACEHOLDER_SRC} alt={item.title} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/10" />
                                </div>
                                <div className="p-6">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.category}</p>
                                    <h3 className="mt-3 text-xl font-extrabold text-slate-900">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                                    <Link href={`/blog/${item.id}`} className="mt-5 inline-block rounded-full border border-indigo-200 px-5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50">
                                        Read More
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <RecoveryCta
                    description="Book an assessment with our clinical team and receive a personalized care pathway designed around your needs."
                    buttonLabel="Schedule Your Consultation"
                />
            </main>

            <GlobalFooter />
        </div>
    );
}

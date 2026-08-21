"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RecoveryCta } from "@/components/RecoveryCta";

const PLACEHOLDER_SRC = "/No-Image-Placeholder%20(2).svg";

type ApiBlog = {
  id: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  status?: "DRAFT" | "PUBLISHED";
  createdAt?: string;
  author?: {
    name?: string;
  };
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type BlogCard = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  meta: string;
  source: "api" | "fallback";
};

const MEDICAL_TOPICS = [
  {
    category: "Prostate Cancer",
    title: "Early warning signs of prostate cancer men should not ignore",
    excerpt:
      "From urinary changes to persistent pelvic discomfort, these clinical red flags can help patients seek specialist care earlier.",
  },
  {
    category: "Kidney Health",
    title: "Kidney failure prevention: daily habits that lower long-term risk",
    excerpt:
      "Hydration, blood pressure control, and medication awareness are key factors in reducing chronic kidney disease progression.",
  },
  {
    category: "Health Tips",
    title: "7 lifestyle adjustments that support urologic recovery after treatment",
    excerpt:
      "Simple routines in nutrition, sleep, movement, and follow-up compliance can improve post-procedure outcomes.",
  },
  {
    category: "Robotic Surgery",
    title: "How robotic-assisted urology is improving precision and recovery",
    excerpt:
      "Robotic platforms provide improved dexterity and visualization, helping surgeons reduce variability during complex procedures.",
  },
  {
    category: "Diagnostics",
    title: "Why timely diagnostics matter in kidney and prostate conditions",
    excerpt:
      "Early-stage diagnosis enables less invasive interventions and better long-term planning for patients and families.",
  },
  {
    category: "Patient Care",
    title: "Understanding your treatment plan: what to ask your specialist",
    excerpt:
      "Knowing what questions to ask improves confidence, shared decisions, and adherence throughout the care journey.",
  },
];

function normalizeBlogImage(image?: string | null) {
  if (!image) return PLACEHOLDER_SRC;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

function estimateReadTime(text: string) {
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(2, Math.round(wordCount / 180));
  return `${minutes} min read`;
}

function toBlogCards(rawBlogs: ApiBlog[]): BlogCard[] {
  return rawBlogs.map((blog, index) => {
    const dateText = blog.createdAt
      ? new Date(blog.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "Recent";
    const bodyText = blog.content || blog.excerpt || "";
    return {
      id: blog.id || `blog-${index}`,
      title: blog.title || "Untitled medical article",
      excerpt:
        blog.excerpt ||
        (bodyText.length > 170 ? `${bodyText.slice(0, 167)}...` : bodyText) ||
        "Clinical insights from the IMO ROBOTIC SURGERY AND ONCOLOGY CENTRE Center specialist team.",
      category: blog.tags?.[0] || "Medical",
      image: normalizeBlogImage(blog.coverImage),
      author: blog.author?.name || "IMO Medical Team",
      meta: `${dateText} • ${estimateReadTime(bodyText || blog.title || "")}`,
      source: "api",
    };
  });
}

function generateFallbackBlogs(count = 6): BlogCard[] {
  const topicPool = [...MEDICAL_TOPICS].sort(() => Math.random() - 0.5);
  const now = new Date();

  return Array.from({ length: count }).map((_, index) => {
    const topic = topicPool[index % topicPool.length];
    const published = new Date(now);
    published.setDate(now.getDate() - index);
    const dateText = published.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    return {
      id: `fallback-${index + 1}`,
      title: topic.title,
      excerpt: topic.excerpt,
      category: topic.category,
      image: PLACEHOLDER_SRC,
      author: "IMO Medical Editorial",
      meta: `${dateText} • ${4 + (index % 4)} min read`,
      source: "fallback",
    };
  });
}

export default function BlogPage() {
  const PAGE_SIZE = 6;
  const [posts, setPosts] = useState<BlogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    let isMounted = true;

    const loadBlogs = async () => {
      setLoading(true);
      setError("");
      setUsingFallback(false);

      try {
        const response = await fetch(`/api/blogs?page=${currentPage}&limit=${PAGE_SIZE}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load blog posts right now.");
        }

        const records: ApiBlog[] = Array.isArray(data?.blogs)
          ? data.blogs
          : Array.isArray(data)
            ? data
            : [];
        const rawPagination = data?.pagination;
        const resolvedPagination: PaginationMeta = {
          page: typeof rawPagination?.page === "number" ? rawPagination.page : currentPage,
          limit: typeof rawPagination?.limit === "number" ? rawPagination.limit : PAGE_SIZE,
          total: typeof rawPagination?.total === "number" ? rawPagination.total : records.length,
          totalPages:
            typeof rawPagination?.totalPages === "number"
              ? rawPagination.totalPages
              : Math.max(1, Math.ceil((records.length || 1) / PAGE_SIZE)),
        };

        const normalized = toBlogCards(records);

        if (isMounted) {
          if (normalized.length === 0 && currentPage === 1) {
            setPosts(generateFallbackBlogs(6));
            setUsingFallback(true);
            setPagination({ page: 1, limit: 6, total: 6, totalPages: 1 });
          } else {
            setPosts(normalized);
            setPagination(resolvedPagination);
          }
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load blog posts right now.");
          if (currentPage === 1) {
            setPosts(generateFallbackBlogs(6));
            setUsingFallback(true);
            setPagination({ page: 1, limit: 6, total: 6, totalPages: 1 });
          } else {
            setPosts([]);
            setUsingFallback(false);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBlogs();

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    posts.forEach((post) => unique.add(post.category));
    return ["View all", ...Array.from(unique)];
  }, [posts]);

  return (
    <div className="bg-slate-100 text-slate-900">
      <Header />

      <main>
        <section className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:px-6 md:pb-24 lg:px-8">
          <Image src="/robots-img.png" alt="Blog hero" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-slate-900/55" />
          <div className="relative mx-auto max-w-6xl text-center">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Stay up to date with the latest
              <br />
              from The IMO ROBOTIC SURGERY AND ONCOLOGY CENTRE
            </h1>
            <p className="mx-auto mt-6 max-w-2xl leading-7 text-slate-200">
              Explore expert articles, surgical milestones, and practical updates on prostate health, kidney care, and advanced treatment options.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {categories.map((category, index) => (
              <button
                key={category}
                className={
                  index === 0
                    ? "rounded-full bg-[#1a1aaa] px-8 py-2.5 text-sm font-semibold text-white"
                    : "text-sm font-medium text-slate-700 hover:text-indigo-700"
                }
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <article key={`blog-skeleton-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-56 animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                    <div className="h-6 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-6 w-5/6 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  </div>
                </article>
              ))}

            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative h-56">
                  <Image src={post.image} alt={post.title} fill className="object-cover" unoptimized />
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold text-slate-500">{post.category}</p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight">
                    <Link
                      href={
                        post.source === "fallback"
                          ? {
                              pathname: `/blog/${post.id}`,
                              query: {
                                title: post.title,
                                excerpt: post.excerpt,
                                category: post.category,
                                author: post.author,
                                image: post.image,
                                meta: post.meta,
                              },
                            }
                          : `/blog/${post.id}`
                      }
                      className="hover:text-indigo-700"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{post.excerpt}</p>

                  <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      <Image src={PLACEHOLDER_SRC} alt="Author" width={32} height={32} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{post.author}</p>
                      <p className="text-xs text-slate-500">{post.meta}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Link
                      href={
                        post.source === "fallback"
                          ? {
                              pathname: `/blog/${post.id}`,
                              query: {
                                title: post.title,
                                excerpt: post.excerpt,
                                category: post.category,
                                author: post.author,
                                image: post.image,
                                meta: post.meta,
                              },
                            }
                          : `/blog/${post.id}`
                      }
                      className="inline-flex rounded-full bg-[#1a1aaa] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#111188]"
                    >
                      Read Article
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!loading && usingFallback && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No uploaded blogs were found in the database. Showing 6 generated medical insight articles for now.
            </div>
          )}

          {!loading && error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !usingFallback && !error && pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from({ length: pagination.totalPages }).map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-full text-sm font-semibold transition ${
                      currentPage === page
                        ? "bg-[#1a1aaa] text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <RecoveryCta description="Connect with our clinical experts today for a personalized assessment and discover the benefits of precision robotic healthcare." />
      </main>

      <GlobalFooter />
    </div>
  );
}

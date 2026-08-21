"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RichTextRenderer } from "@/components/RichTextRenderer";

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
  updatedAt?: string;
  author?: {
    name?: string;
    email?: string;
  };
};

type BlogDetail = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  meta: string;
};

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

function toDetail(blog: ApiBlog): BlogDetail {
  const body = blog.content || blog.excerpt || "Clinical guidance from our specialist team.";
  const dateText = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Recent";

  return {
    id: blog.id,
    title: blog.title || "Untitled medical article",
    excerpt: blog.excerpt || body,
    content: body,
    image: normalizeBlogImage(blog.coverImage),
    category: blog.tags?.[0] || "Medical",
    author: blog.author?.name || "IMO Medical Team",
    meta: `${dateText} • ${estimateReadTime(body)}`,
  };
}

function fallbackContent(title: string, excerpt: string, category: string) {
  return `
    <p>${excerpt}</p>
    <p><strong>${title}</strong> remains an important subject in modern patient-centered care. In clinical practice, prevention, early diagnosis, and continuous follow-up significantly improve treatment outcomes for patients with prostate and kidney-related conditions.</p>
    <h3>Clinical perspective</h3>
    <p>At IMO ROBOTIC SURGERY AND ONCOLOGY CENTRE, specialists combine diagnostics, evidence-based protocols, and precision-guided intervention strategies to improve safety and recovery.</p>
    <h3>Practical guidance for patients</h3>
    <ul>
      <li>Keep routine screening schedules and follow-up appointments.</li>
      <li>Report new symptoms early to your care team.</li>
      <li>Maintain treatment adherence and healthy daily habits.</li>
    </ul>
    <p>These steps support better outcomes across ${category.toLowerCase()} pathways.</p>
  `;
}

export default function SingleBlogPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fallbackFromQuery = useMemo(() => {
    if (!params?.id?.startsWith("fallback-")) return null;

    const title = searchParams.get("title") || "Medical Insight";
    const excerpt = searchParams.get("excerpt") || "Clinical guidance from our specialist team.";
    const category = searchParams.get("category") || "Medical";
    const author = searchParams.get("author") || "IMO Medical Editorial";
    const image = searchParams.get("image") || PLACEHOLDER_SRC;
    const meta = searchParams.get("meta") || `Recent • ${estimateReadTime(excerpt)}`;

    return {
      id: params.id,
      title,
      excerpt,
      content: fallbackContent(title, excerpt, category),
      image,
      category,
      author,
      meta,
    } satisfies BlogDetail;
  }, [params?.id, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      if (!params?.id) return;

      if (fallbackFromQuery) {
        setPost(fallbackFromQuery);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/blogs/${params.id}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load this blog post right now.");
        }

        const raw: ApiBlog | null = data?.blog ?? data ?? null;
        if (!raw || !raw.id) {
          throw new Error("Blog post not found.");
        }

        if (isMounted) {
          setPost(toDetail(raw));
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load this blog post right now.");
          setPost(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [fallbackFromQuery, params?.id]);

  return (
    <div className="bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <Link href="/blog" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Back to Blog
        </Link>

        {loading && (
          <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-64 animate-pulse bg-slate-200" />
            <div className="space-y-4 p-6 sm:p-8">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            </div>
          </article>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && post && (
          <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-64 sm:h-80">
              <Image src={post.image} alt={post.title} fill className="object-cover" unoptimized />
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">{post.category}</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
              <p className="mt-4 text-sm text-slate-500">By {post.author} • {post.meta}</p>

              <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-base leading-7 text-slate-700">{post.excerpt}</p>

              <RichTextRenderer html={post.content} className="rich-text mt-6" />
            </div>
          </article>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}

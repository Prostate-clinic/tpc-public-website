"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function AdminSingleBlogPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<ApiBlog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      if (!params?.id) return;

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
          setPost(raw);
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
  }, [params?.id]);

  return (
    <div className="bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <Link href="/admin/blogs" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Back to Admin Blogs
        </Link>

        {loading && (
          <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-64 animate-pulse bg-slate-200" />
            <div className="space-y-4 p-6 sm:p-8">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
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
              <Image src={normalizeBlogImage(post.coverImage)} alt={post.title} fill className="object-cover" unoptimized />
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {(post.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {tag}
                  </span>
                ))}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${post.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {post.status || "PUBLISHED"}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
              <p className="mt-3 text-sm text-slate-500">
                By {post.author?.name || "IMO Medical Team"} • {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent"} • {estimateReadTime(post.content || post.excerpt || post.title)}
              </p>

              {post.excerpt && (
                <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-base leading-7 text-slate-700">{post.excerpt}</p>
              )}

              <RichTextRenderer html={post.content || post.excerpt || "No content available."} className="rich-text mt-6" />
            </div>
          </article>
        )}
      </main>

      <GlobalFooter />
    </div>
  );
}

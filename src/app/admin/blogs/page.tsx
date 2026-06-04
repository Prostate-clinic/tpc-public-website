"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";

const PLACEHOLDER_SRC = "/No-Image-Placeholder%20(2).svg";

type ApiBlog = {
  id: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  status?: "DRAFT" | "PUBLISHED";
  createdAt?: string;
  author?: {
    name?: string;
  };
};

function normalizeBlogImage(image?: string | null) {
  if (!image) return PLACEHOLDER_SRC;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBlogs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/blogs", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load blogs right now.");
        }

        const records: ApiBlog[] = Array.isArray(data?.blogs)
          ? data.blogs
          : Array.isArray(data)
            ? data
            : [];

        if (isMounted) {
          setBlogs(records);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load blogs right now.");
          setBlogs([]);
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
  }, []);

  return (
    <div className="bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Admin</p>
          <h1 className="mt-3 text-3xl font-bold">Blog Management</h1>
          <p className="mt-3 text-sm text-slate-600">Review blog entries and open each article in full read view.</p>

          {loading && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading blogs...
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && blogs.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No blogs available.
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => (
              <article key={blog.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-48">
                  <Image src={normalizeBlogImage(blog.coverImage)} alt={blog.title} fill className="object-cover" unoptimized />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{blog.tags?.[0] || "Medical"}</p>
                  <h2 className="mt-2 text-xl font-semibold leading-tight">{blog.title}</h2>
                  <p className="mt-3 text-sm text-slate-600">{blog.excerpt || "No excerpt available."}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{blog.author?.name || "IMO Medical Team"}</span>
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${blog.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {blog.status || "PUBLISHED"}
                    </span>
                  </div>
                  <Link href={`/admin/blogs/${blog.id}`} className="mt-4 inline-flex rounded-full bg-[#1a1aaa] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#111188]">
                    Read
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}

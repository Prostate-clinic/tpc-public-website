"use client";

import Link from "next/link";
import Image from "next/image";
import { type ReactNode } from "react";

type AuthLayoutProps = {
  title: ReactNode;
  subtitle: ReactNode;
  icon: ReactNode;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthLayout({ title, subtitle, icon, children, footer }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0f3a] text-white">
      {/* Robot background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/robots-img.png')" }}
        aria-hidden="true"
      />

      {/* Readability overlay — flat, no gradients */}
      <div className="absolute inset-0 bg-[#0b0f3a]/85" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-10">
        {/* Brand */}
        

        {/* Card */}
        <div className="w-full rounded-lg border border-white/15 bg-white/95 p-7 text-gray-900 shadow-2xl sm:p-9">
          <div className="mb-6 text-center">
            <Link href="/" className="mb-2 flex items-center justify-center gap-3 rounded-md">
              <Image src="/logo.png" alt="Imo Robotic Surgery and Oncology Center" width={90} height={90} className="h-auto" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.7rem]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Footer / cross-links */}
        <div className="mt-6 w-full text-center text-sm text-white/80">{footer}</div>
      </div>
    </main>
  );
}

/** Shared "back to home" link component used across auth pages. */
export function AuthBackLink() {
  return (
    <a
      href="/"
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/80 transition hover:text-white"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back to home
    </a>
  );
}

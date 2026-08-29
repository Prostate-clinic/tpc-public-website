"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePatientAuth } from "@/contexts/PatientAuthContext";
import PasswordInput from "@/components/PasswordInput";

export function Header() {
  const [deptOpen, setDeptOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDeptOpen, setMobileDeptOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const apptRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { patient, login, logout } = usePatientAuth();
  const pathname = usePathname();

  // Close appointment dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (apptRef.current && !apptRef.current.contains(e.target as Node)) {
        setApptOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDeptOpen(false);
    setMobileDeptOpen(false);
    setApptOpen(false);
  }, [pathname]);

  // Deep link: /?signin=1 opens the login modal directly, so pages like the
  // patient portal can offer real "Sign in" buttons instead of telling people
  // to go find the header. The param is stripped immediately so a refresh or
  // back-navigation does not re-trigger the modal.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signin") !== "1") return;

    params.delete("signin");
    const remaining = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${remaining ? `?${remaining}` : ""}`);

    // Auth hydrates from sessionStorage AFTER mount, so `patient` is still
    // null here even for signed-in users — check storage instead. Someone
    // with an active session has no business seeing a login prompt.
    if (!sessionStorage.getItem("patient_auth")) {
      openLoginModal();
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openLoginModal = () => {
    setLoginError("");
    setLoginOpen(true);
  };

  const goToPortal = (section?: "book" | "history") => {
    setApptOpen(false);
    const search = section ? `?section=${section}` : "";
    router.push(`/patient-portal${search}`);
  };

  const handleProtectedPortalNavigation = (section: "book" | "history") => {
    if (patient) {
      goToPortal(section);
      return;
    }
    setApptOpen(false);
    openLoginModal();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/patients/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message ?? "Login failed. Check your credentials.");
        return;
      }
      login(data.access_token, data.patient);
      setLoginOpen(false);
      setLoginEmail("");
      setLoginPassword("");
      router.push("/patient-portal");
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLoginOpen(false);
    setLoginEmail("");
    setLoginPassword("");
  };

  const deptLinks = [
    { href: "/departments#administrative", label: "Administrative Departments" },
    { href: "/departments#outpatient", label: "Outpatient Department" },
    { href: "/departments#theatre", label: "Theatre Department" },
    { href: "/departments#inpatient", label: "Inpatient Departments" },
    { href: "/departments#anesthesia", label: "Anesthesia Department" },
    { href: "/departments#surgical", label: "Surgical Departments" },
    { href: "/departments#diagnostics", label: "Lab and Diagnostic Departments" },
    { href: "/departments#phlebotomy", label: "Phlebotomy" },
    { href: "/departments#pharmacology", label: "Pharmacology Departments" },
  ];

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/doctors", label: "Our Team" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
  ];

  const departmentsActive = isActive("/departments");

  return (
    <>
    <header
      className={isScrolled
        ? "sticky top-2 z-30 mx-3 rounded-full border border-black/10 bg-white/85 shadow-lg backdrop-blur-2xl transition-all duration-300 md:top-0 md:mx-0 md:rounded-none md:border-x-0 md:border-t-0 md:shadow-none md:overflow-visible"
        : "sticky top-0 z-30 border-b border-black/10 bg-white/50 backdrop-blur-2xl transition-all duration-300 md:overflow-visible"}
    >
      <div className="mx-auto flex w-full items-center justify-between px-5 py-3 sm:px-6 sm:py-5 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-[cursive] text-2xl font-bold text-black">
          <Image src="/logo.png" alt="Logo" width={70} height={40} />
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "border-b-2 border-primary pb-0.5 font-semibold text-primary" : "hover:text-primary"}
            >
              {item.label}
            </Link>
          ))}

          {/* Departments dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1">
              <Link
                href="/departments"
                className={departmentsActive ? "border-b-2 border-primary pb-0.5 font-semibold text-primary" : "hover:text-primary"}
              >
                Departments
              </Link>
              <button
                onClick={() => setDeptOpen((o) => !o)}
                aria-label="Open departments menu"
                className={departmentsActive ? "text-primary" : "hover:text-primary"}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div
              aria-hidden={!deptOpen}
              className={deptOpen
                ? "absolute left-0 top-full z-20 mt-2 w-64 translate-y-0 rounded-md border border-black/10 bg-white py-2 opacity-100 shadow-lg transition-all duration-200 ease-out"
                : "pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 -translate-y-1 rounded-md border border-black/10 bg-white py-2 opacity-0 shadow-lg transition-all duration-200 ease-in"}
            >
                {deptLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="block px-4 py-2 text-sm hover:bg-gray-50">
                    {item.label}
                  </Link>
                ))}
              </div>
          </div>
        </nav>

        {/* CTA buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Appointment dropdown */}
          <div className="relative" ref={apptRef}>
            <button
              onClick={() => setApptOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Appointment
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              aria-hidden={!apptOpen}
              className={apptOpen
                ? "absolute right-0 top-full z-20 mt-2 w-52 translate-y-0 rounded-md border border-black/10 bg-white py-1 opacity-100 shadow-lg transition-all duration-200 ease-out"
                : "pointer-events-none absolute right-0 top-full z-20 mt-2 w-52 -translate-y-1 rounded-md border border-black/10 bg-white py-1 opacity-0 shadow-lg transition-all duration-200 ease-in"}
            >
                <Link
                  href="/appointment"
                  onClick={() => setApptOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Book Appointment
                </Link>
                <Link
                  href={patient ? "/patient-portal?section=history" : "#"}
                  onClick={(event) => {
                    event.preventDefault();
                    handleProtectedPortalNavigation("history");
                  }}
                  className="block px-4 py-2.5 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Appointment History
                </Link>
              </div>
          </div>

          {/* Login button */}
          <button
            onClick={() => {
              if (patient) {
                goToPortal();
                return;
              }
              openLoginModal();
            }}
            className="rounded-full bg-[#1a1aaa] px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {patient ? patient.name.split(" ")[0] : "Login"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

    </header>

    <div className={mobileOpen ? "fixed inset-0 z-40 md:hidden" : "pointer-events-none fixed inset-0 z-40 md:hidden"}>
      <button
        type="button"
        aria-label="Close mobile menu"
        onClick={() => setMobileOpen(false)}
        className={mobileOpen ? "absolute inset-0 bg-black/35 opacity-100 transition-opacity duration-300" : "absolute inset-0 bg-black/35 opacity-0 transition-opacity duration-300"}
      />

      <aside
        aria-hidden={!mobileOpen}
        className={mobileOpen
          ? "absolute right-0 top-0 h-full w-[86%] max-w-sm translate-x-0 overflow-y-auto border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out"
          : "absolute right-0 top-0 h-full w-[86%] max-w-sm translate-x-full overflow-y-auto border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in"}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="Logo" width={70} height={20} />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg border border-slate-300 p-2 text-slate-700"
            aria-label="Close menu"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4">
          <nav className="space-y-1 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "block rounded-md bg-indigo-50 px-3 py-2 font-semibold text-primary" : "block rounded-md px-3 py-2 hover:bg-slate-50"}
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => setMobileDeptOpen((open) => !open)}
              className={departmentsActive ? "flex w-full items-center justify-between rounded-md bg-indigo-50 px-3 py-2 font-semibold text-primary" : "flex w-full items-center justify-between rounded-md px-3 py-2 hover:bg-slate-50"}
            >
              <span>Departments</span>
              <svg className={mobileDeptOpen ? "h-4 w-4 rotate-180 transition" : "h-4 w-4 transition"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              aria-hidden={!mobileDeptOpen}
              className={mobileDeptOpen
                ? "mt-1 max-h-80 space-y-1 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-2 opacity-100 transition-all duration-250 ease-out"
                : "mt-1 max-h-0 space-y-1 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-0 opacity-0 transition-all duration-250 ease-in"}
            >
              {deptLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded px-2 py-1.5 text-sm hover:bg-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
            <Link
              href="/appointment"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-full border border-indigo-200 bg-white px-5 py-2.5 text-center text-sm font-semibold text-indigo-700"
            >
              Book Appointment
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                if (patient) {
                  goToPortal();
                  return;
                }
                openLoginModal();
              }}
              className="w-full rounded-full bg-[#1a1aaa] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {patient ? "Go to Portal" : "Login"}
            </button>
          </div>
        </div>
      </aside>
    </div>

      {/* Login / Patient Portal Modal — rendered outside <header> to avoid stacking context clipping */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setLoginOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Patient Portal</h2>
              <button onClick={() => setLoginOpen(false)} className="rounded-full p-1 hover:bg-gray-100" aria-label="Close">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="mb-5 text-sm text-gray-500">Sign in to access your patient portal, review your appointment history, and continue booking.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                  <PasswordInput
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {loginError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loginError}</p>
                )}
                <div className="flex justify-end">
                  <Link
                    href={`/forgot-password${loginEmail.trim() ? `?email=${encodeURIComponent(loginEmail.trim())}` : ""}`}
                    onClick={() => setLoginOpen(false)}
                    className="text-xs font-medium text-indigo-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-lg bg-[#1a1aaa] py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60"
                >
                  {loginLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" onClick={() => setLoginOpen(false)} className="font-semibold text-indigo-700 hover:underline">
                  Register
                </Link>
              </p>
              {patient && (
                <div className="mt-4 border-t pt-4">
                  <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:underline">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

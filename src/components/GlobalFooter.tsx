import Image from "next/image";
import Link from "next/link";

type GlobalFooterProps = {
  id?: string;
};

const pathways = [
  { href: "/services", label: "Clinical Services" },
  { href: "/departments", label: "Departments" },
  { href: "/doctors", label: "Our Specialists" },
  { href: "/appointment", label: "Book Appointment" },
];

const resources = [
  { href: "/about", label: "About Imo Robotics and Oncology Center" },
  { href: "/blog", label: "Health Articles" },
  { href: "/contact", label: "Support Center" },
  { href: "/contact", label: "Insurance & Billing" },
];

const connect = [
  { href: "mailto:info@prostateclinicnigeria.com", label: "info@prostateclinicnigeria.com" },
  { href: "tel:+2349019057016", label: "+234 901 905 7016" },
  { href: "tel:+2349036947385", label: "+234 903 694 7385" },
];

export function GlobalFooter({ id }: GlobalFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer id={id} className="relative overflow-hidden border-t border-slate-200 bg-linear-to-b from-white via-slate-50 to-cyan-50/40 text-slate-700">
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-16">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_35px_-22px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-8">
          <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Stay Informed</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                Receive trusted recovery guidance and clinic updates.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Monthly insights from our specialists on robotic surgery, prostate health screening, and structured post-treatment care.
              </p>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <input
                type="email"
                placeholder="Enter your email address"
                aria-label="Email address"
                className="h-12 w-full rounded-full border border-slate-300 bg-white px-5 text-sm text-slate-900 placeholder:text-slate-500 outline-none ring-cyan-400/40 focus:ring"
              />
              <button className="h-12 shrink-0 rounded-full bg-cyan-600 px-7 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-cyan-500">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="Imo Robotics and Oncology Center" width={96} height={44} className="h-10 w-auto" />
              <span className="text-sm font-semibold tracking-wide text-slate-800">Imo Robotics and Oncology Center</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
              Advanced prostate and urologic care powered by precision robotics, AI-assisted diagnostics, and multidisciplinary expertise.
            </p>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              Lagos: 200a Muri Okunola Street, Victoria Island
              <br />
              Owerri: Specialist consultation and diagnostics hub
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">Care Pathways</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {pathways.map((item) => (
                <Link key={item.href} href={item.href} className="block transition hover:text-cyan-700">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">Patient Resources</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {resources.map((item) => (
                <Link key={item.label} href={item.href} className="block transition hover:text-cyan-700">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">Contact</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {connect.map((item) => (
                <a key={item.href} href={item.href} className="block transition hover:text-cyan-700">
                  {item.label}
                </a>
              ))}
              <p className="pt-2 text-xs text-slate-500">Mon - Sat: 8:00 AM - 7:00 PM</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <p>© {year} Imo Robotics and Oncology Center. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/contact" className="transition hover:text-slate-700">Privacy Policy</Link>
            <Link href="/contact" className="transition hover:text-slate-700">Terms of Service</Link>
            <Link href="/contact" className="transition hover:text-slate-700">Patient Help Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

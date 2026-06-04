import Link from "next/link";

type RecoveryCtaProps = {
  title?: string;
  description: string;
  buttonLabel?: string;
  sectionClassName?: string;
};

export function RecoveryCta({
  title = "Start Your Journey To Recovery",
  description,
  buttonLabel = "Schedule Your Consultation Today",
  sectionClassName = "mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-24",
}: RecoveryCtaProps) {
  return (
    <section className={sectionClassName}>
      <div className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white px-6 py-14 text-center shadow-lg shadow-slate-200/50 sm:px-10">
        <h2 className="text-4xl font-bold">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">{description}</p>
        <Link
          href="/appointment"
          className="mt-8 inline-block rounded-full bg-[#1a1aaa] px-10 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/25 transition hover:-translate-y-0.5 hover:bg-[#111188]"
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
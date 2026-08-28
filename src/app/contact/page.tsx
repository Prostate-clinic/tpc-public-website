"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircleMore, PhoneCall, type LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RecoveryCta } from "@/components/RecoveryCta";

type ContactCard = {
  title: string;
  text: string;
  detail: string;
  icon: LucideIcon;
};

const contactCards: ContactCard[] = [
  {
    title: "Email",
    text: "Send us your inquiries and we will respond with detailed support as soon as possible.",
    detail: "info@prostateclinicnigeria.com",
    icon: Mail,
  },
  {
    title: "Live Chat",
    text: "Chat with us in real time for quick answers and instant support.",
    detail: "+2349019057016",
    icon: MessageCircleMore,
  },
  {
    title: "Phone",
    text: "Speak directly with our team for immediate assistance and guidance.",
    detail: "+2349036947385",
    icon: PhoneCall,
  },
];

export default function ContactPage() {
  return (
    <div className="bg-slate-100 text-slate-900">
      <Header />

      <main>
        <section className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:px-6 md:pb-24 lg:px-8">
          <Image src="/robots-img.png" alt="Contact hero" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-slate-900/55" />
          <div className="relative mx-auto max-w-6xl text-center">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl font-[family-name:var(--font-poppins)]">
              Get in Touch With The
              <br />
              Imo Robotic Surgery and Oncology Center
            </h1>
            <p className="mx-auto mt-6 max-w-2xl leading-7 text-slate-200">
              Whether you have questions about treatment, need support, or want to schedule an appointment, our team is here to help.
            </p>
            <Link href="/appointment" className="mt-8 inline-block rounded-full bg-[#1a1aaa] px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#111188]">
              Book Appointment
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="text-4xl font-bold tracking-tight">Contact us</h2>
              <p className="mt-4 text-slate-600">We are here to help you every step of the way</p>

              <form className="mt-8 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                    <input
                      type="text"
                      placeholder="Emmadiolong"
                      className="h-12 w-full rounded-xl border border-indigo-500 px-4 outline-none ring-indigo-300 focus:ring"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                    <input
                      type="text"
                      placeholder="Emmadiolong"
                      className="h-12 w-full rounded-xl border border-indigo-500 px-4 outline-none ring-indigo-300 focus:ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    type="email"
                    placeholder="emmy.odiong06@gmail.com"
                    className="h-12 w-full rounded-xl border border-indigo-500 px-4 outline-none ring-indigo-300 focus:ring"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Any specific symptoms, medical history, or concerns you would like to share..."
                    className="w-full rounded-xl border border-indigo-500 px-4 py-3 outline-none ring-indigo-300 focus:ring"
                  />
                </div>

                <button className="rounded-full bg-[#1a1aaa] px-10 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]">
                  Submit
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="relative h-132 w-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7!2d7.0368!3d5.4836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMjknMDEuMCJOIDDCsDAyJzEyLjAiRQ!5e0!3m2!1sen!2sng!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
              </div>
              <div className="p-6">
                <p className="text-sm leading-6 text-slate-600">
                  Inside the Imo State Specialist Hospital Complex, Umuguma, Owerri West L.G.A, Imo State
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-6 md:grid-cols-3">
            {contactCards.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                  <p className="mt-5 text-sm font-medium text-slate-900">{item.detail}</p>
                </article>
              );
            })}
          </div>
        </section>

        <RecoveryCta description="Connect with our clinical experts today for a personalized assessment and discover the benefits of precision robotic healthcare." />
      </main>

      <GlobalFooter />
    </div>
  );
}

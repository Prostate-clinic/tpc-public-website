"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircleMore, PhoneCall, type LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { GlobalFooter } from "@/components/GlobalFooter";
import { RecoveryCta } from "@/components/RecoveryCta";

const PLACEHOLDER_SRC = "/No-Image-Placeholder%20(2).svg";

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

const locations = [
  {
    city: "Owerri, Imo",
    address: "123 Sample St, Sydney NSW 2000 AU",
  },
  {
    city: "Lagos",
    address: "200a Muri Okunola Street, Off Ajose Adeogun Street, Victoria Island, Lagos Nigeria",
  },
  {
    city: "London",
    address: "123 Sample St, London W1C 1DE, United Kingdom",
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
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
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

            <div className="relative h-132 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Image src={PLACEHOLDER_SRC} alt="Clinic building" fill className="object-cover" />
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

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight">Locations</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Find our clinic easily and access world-class care at a location designed for your comfort and convenience.
          </p>

          <div className="mt-10 h-[500px] grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="rounded-3xl bg-white p-6 shadow-sm h-full">
              <div className="space-y-8 border-l-4 border-indigo-700 pl-5">
                {locations.map((location) => (
                  <div key={location.city}>
                    <h3 className="text-xl font-semibold">{location.city}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{location.address}</p>
                    <a href="#" className="mt-3 inline-block text-sm font-medium text-indigo-700 underline underline-offset-4">
                      View Map
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Image src={PLACEHOLDER_SRC} alt="Location map" height={500} width={500} className="object-cover h-full w-full" />
            </div>
          </div>
        </section>

        <RecoveryCta description="Connect with our clinical experts today for a personalized assessment and discover the benefits of precision robotic healthcare." />
      </main>

      <GlobalFooter />
    </div>
  );
}

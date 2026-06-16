"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, ClipboardCheck, FileText, Stethoscope, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Step = {
    id: number;
    title: string;
    subtitle: string;
    icon: LucideIcon;
};

type ServiceOption = {
    id: string;
    category: "surgical" | "consultation" | "diagnostics" | "imaging";
    name: string;
    duration: string;
    price: string;
    blurb: string;
    focus: string[];
};

type ApiService = {
    id: string;
    name: string;
    category: "SURGICAL" | "CONSULTATION" | "DIAGNOSTICS" | "IMAGING";
    duration: number | string;
    price: number | string;
    description?: string | null;
    focus?: string[] | null;
};

type DoctorOption = {
    id: string;
    name: string;
    specialty: string;
    availability: string;
    image: string;
    bio: string;
};

type ApiDoctor = {
    id: string;
    name: string;
    specialty: string;
    bio: string | null;
    image: string | null;
    slots?: Array<{
        date: string;
    }>;
};

type SlotOption = {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
};

const appointmentDurations = ["15 min", "30 min", "45 min", "1 hour"] as const;
const timeOptions = ["07:00 AM", "08:00 AM", "09:30 AM", "11:30 AM", "12:00 PM", "01:00 PM", "02:30 PM", "04:00 PM"];

const steps: Step[] = [
    { id: 1, title: "Services", subtitle: "Pick a treatment pathway", icon: Stethoscope },
    { id: 2, title: "Specialist", subtitle: "Choose your clinician", icon: UserRound },
    { id: 3, title: "Schedule", subtitle: "Reserve a time slot", icon: CalendarDays },
    { id: 4, title: "Details", subtitle: "Patient information", icon: FileText },
    { id: 5, title: "Review", subtitle: "Confirm your booking", icon: ClipboardCheck },
];

const serviceCategories = [
    { id: "all", label: "All Services", hint: "Browse every available option" },
    { id: "surgical", label: "Surgical Procedures", hint: "Robotic and minimally invasive" },
    { id: "consultation", label: "Consultation & Assessment", hint: "Clinical evaluation and care planning" },
    { id: "diagnostics", label: "Diagnostics", hint: "Lab and screening pathways" },
    { id: "imaging", label: "Imaging Services", hint: "Advanced MRI and visual analysis" },
] as const;

const FALLBACK_DOCTOR_IMAGE = "/No-Image-Placeholder%20(2).svg";

function formatAvailability(dateValue?: string) {
    if (!dateValue) return "Next opening: Not available";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Next opening: Not available";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfSlotDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round((startOfSlotDay.getTime() - startOfToday.getTime()) / 86400000);

    if (dayDiff === 0) return "Next opening: Today";
    if (dayDiff === 1) return "Next opening: Tomorrow";

    return `Next opening: ${date.toLocaleDateString("en-US", { weekday: "short" })}`;
}

function normalizeServiceCategory(category: ApiService["category"]): ServiceOption["category"] {
    if (category === "SURGICAL") return "surgical";
    if (category === "CONSULTATION") return "consultation";
    if (category === "DIAGNOSTICS") return "diagnostics";
    return "imaging";
}

function formatServicePrice(value: number | string) {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return "Price available on request";
    return `From NGN ${numericValue.toLocaleString("en-NG")}`;
}

function getStepStatus(stepId: number, currentStep: number) {
    if (stepId < currentStep) return "complete";
    if (stepId === currentStep) return "active";
    return "pending";
}

export function AppointmentFlow() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
    const [selectedDateInput, setSelectedDateInput] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<(typeof appointmentDurations)[number]>("15 min");
    const [startTime, setStartTime] = useState("07:00 AM");
    const [endTime, setEndTime] = useState("01:00 PM");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [activeServiceCategory, setActiveServiceCategory] = useState<(typeof serviceCategories)[number]["id"]>("all");
    const [services, setServices] = useState<ServiceOption[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState("");
    const [doctors, setDoctors] = useState<DoctorOption[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [doctorsError, setDoctorsError] = useState("");

    const stepLabel = useMemo(() => {
        return steps.find((step) => step.id === currentStep);
    }, [currentStep]);

    const filteredServices = useMemo(() => {
        if (activeServiceCategory === "all") return services;
        return services.filter((service) => service.category === activeServiceCategory);
    }, [activeServiceCategory, services]);

    const canContinue = useMemo(() => {
        if (currentStep === 1) return Boolean(selectedService);
        if (currentStep === 2) return Boolean(selectedDoctor);
        if (currentStep === 3) return Boolean(selectedSlot);
        if (currentStep === 4) {
            return fullName.trim().length > 2 && email.includes("@") && phone.trim().length > 7;
        }
        if (currentStep === 5) return true;
        return false;
    }, [currentStep, selectedService, selectedDoctor, selectedSlot, fullName, email, phone]);

    const allReady = Boolean(selectedService && selectedDoctor && selectedSlot && fullName && email && phone);

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        if (!selectedDateInput) setSelectedDateInput(today);
    }, [selectedDateInput]);

    useEffect(() => {
        const parsed = new Date(`${selectedDateInput}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) {
            setSelectedDate(parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
        }
    }, [selectedDateInput]);

    useEffect(() => {
        setSelectedSlot({
            id: `${selectedDuration}-${startTime}-${endTime}`,
            label: `${selectedDuration} | ${startTime} - ${endTime}`,
            startTime,
            endTime,
        });
    }, [selectedDuration, startTime, endTime]);

    useEffect(() => {
        let isMounted = true;

        const loadServices = async () => {
            setServicesLoading(true);
            setServicesError("");

            try {
                const response = await fetch("/api/services", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Unable to load services right now.");
                }

                const payload = await response.json();
                const records: ApiService[] = Array.isArray(payload?.services) ? payload.services : [];

                const mappedServices: ServiceOption[] = records.map((service) => ({
                    id: service.id,
                    category: normalizeServiceCategory(service.category),
                    name: service.name,
                    duration: `${service.duration} min`,
                    price: formatServicePrice(service.price),
                    blurb: service.description || "Specialist-led treatment pathway tailored for high-confidence outcomes.",
                    focus:
                        Array.isArray(service.focus) && service.focus.length > 0
                            ? service.focus
                            : ["Consult specialist", "Tailored treatment plan", "Coordinated follow-up"],
                }));

                if (isMounted) {
                    setServices(mappedServices);
                }
            } catch (error) {
                if (isMounted) {
                    setServicesError(error instanceof Error ? error.message : "Unable to load services right now.");
                    setServices([]);
                }
            } finally {
                if (isMounted) {
                    setServicesLoading(false);
                }
            }
        };

        loadServices();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (selectedService && !services.some((service) => service.id === selectedService.id)) {
            setSelectedService(null);
        }
    }, [services, selectedService]);

    useEffect(() => {
        let isMounted = true;

        const loadDoctors = async () => {
            setDoctorsLoading(true);
            setDoctorsError("");

            try {
                const response = await fetch("/api/doctors", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Unable to load specialists right now.");
                }

                const payload = await response.json();
                const records: ApiDoctor[] = Array.isArray(payload?.doctors) ? payload.doctors : [];

                const mappedDoctors: DoctorOption[] = records.map((doctor) => {
                    const nextSlot = Array.isArray(doctor.slots) && doctor.slots.length > 0 ? doctor.slots[0] : undefined;

                    return {
                        id: doctor.id,
                        name: doctor.name,
                        specialty: doctor.specialty,
                        availability: formatAvailability(nextSlot?.date),
                        image: doctor.image || FALLBACK_DOCTOR_IMAGE,
                        bio:
                            doctor.bio ||
                            "Experienced specialist delivering evidence-based urologic care with a patient-first approach.",
                    };
                });

                if (isMounted) {
                    setDoctors(mappedDoctors);
                }
            } catch (error) {
                if (isMounted) {
                    setDoctorsError(error instanceof Error ? error.message : "Unable to load specialists right now.");
                    setDoctors([]);
                }
            } finally {
                if (isMounted) {
                    setDoctorsLoading(false);
                }
            }
        };

        loadDoctors();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (selectedDoctor && !doctors.some((doctor) => doctor.id === selectedDoctor.id)) {
            setSelectedDoctor(null);
        }
    }, [doctors, selectedDoctor]);

    const moveNext = () => {
        if (!canContinue || currentStep >= 5) return;
        setCurrentStep((prev) => prev + 1);
    };

    const moveBack = () => {
        if (currentStep <= 1) return;
        setCurrentStep((prev) => prev - 1);
    };

    const confirmBooking = async () => {
        if (!allReady || isSubmitting) return;
        setIsSubmitting(true);
        setSubmitError("");
        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    serviceId: selectedService!.id,
                    doctorId: selectedDoctor!.id,
                    date: selectedDateInput,
                    startTime: selectedSlot!.startTime,
                    endTime: selectedSlot!.endTime,
                    slotId: null,
                    fullName,
                    email,
                    phone,
                    notes,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to book appointment");
            }

            setIsConfirmed(true);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-6 lg:px-8 lg:pb-24">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-0 top-24 h-48 w-48 rounded-full bg-cyan-200/50 blur-3xl" />
                <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-indigo-200/60 blur-3xl" />
            </div>

            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">Appointment Flow</p>
                <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                    A single flow for service selection, specialist matching, scheduling, and patient details with real-time summary.
                </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
                <div className="overflow-x-auto pb-3 scrollbar-hide">
                    <div className="flex min-w-205 items-start px-2 pt-1">
                        {steps.map((step, index) => {
                            const status = getStepStatus(step.id, currentStep);
                            const StepIcon = step.icon;
                            return (
                                <div key={step.id} className="flex flex-1 items-start">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(step.id)}
                                        className="group flex min-w-32.5 flex-col items-center text-center transition"
                                        aria-current={status === "active" ? "step" : undefined}
                                    >
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${status === "complete"
                                                    ? "border-indigo-700 bg-indigo-700 text-white"
                                                    : status === "active"
                                                        ? "border-indigo-700 bg-indigo-700 text-white"
                                                        : "border-slate-200 bg-slate-100 text-slate-500"
                                                }`}
                                        >
                                            {status === "pending" ? <StepIcon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                        </span>
                                        <span
                                            className={`mt-2 block text-sm font-normal transition ${status === "pending" ? "text-slate-500" : "text-slate-900"
                                                }`}
                                        >
                                            {step.title}
                                        </span>
                                    </button>
                                    {index < steps.length - 1 && (
                                        <span className="mt-4 flex-1 px-2">
                                            <span
                                                className={`block h-0.5 w-full rounded-full transition ${currentStep > step.id ? "bg-indigo-700" : "bg-slate-200"
                                                    }`}
                                            />
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="rounded-3xl border border-slate-200 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Step {currentStep}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{stepLabel?.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{stepLabel?.subtitle}</p>

                        <div className="mt-6">
                            {currentStep === 1 && (
                                <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
                                    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="mb-3 text-sm font-semibold text-slate-900">Service Categories</p>
                                        <div className="space-y-2">
                                            {serviceCategories.map((category) => {
                                                const isActive = activeServiceCategory === category.id;
                                                return (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => setActiveServiceCategory(category.id)}
                                                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${isActive
                                                            ? "border-indigo-200 bg-indigo-50"
                                                            : "border-slate-200 bg-white hover:border-indigo-100"
                                                            }`}
                                                    >
                                                        <p className={`text-sm font-semibold ${isActive ? "text-indigo-700" : "text-slate-900"}`}>{category.label}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{category.hint}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </aside>

                                    <div className="space-y-3">
                                        {servicesLoading && (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                                Loading services...
                                            </div>
                                        )}

                                        {servicesError && (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                                {servicesError}
                                            </div>
                                        )}

                                        {filteredServices.map((service) => {
                                            const selected = selectedService?.id === service.id;
                                            return (
                                                <article
                                                    key={service.id}
                                                    className={`rounded-2xl border p-4 transition ${selected
                                                        ? "border-indigo-300 bg-indigo-50/60 shadow-md shadow-indigo-100"
                                                        : "border-slate-200 bg-white hover:border-indigo-200"
                                                        }`}
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-base font-semibold text-slate-900">{service.name}</p>
                                                            <p className="mt-1 text-sm text-slate-600">{service.blurb}</p>
                                                        </div>
                                                        <div className="flex gap-2 text-xs font-semibold">
                                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{service.duration}</span>
                                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{service.price}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {service.focus.map((item) => (
                                                            <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedService(service)}
                                                            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${selected
                                                                ? "bg-[#1a1aaa] text-white"
                                                                : "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                                                                }`}
                                                        >
                                                            {selected ? "Selected" : "Select Service"}
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })}

                                        {!servicesLoading && filteredServices.length === 0 && !servicesError && (
                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                                No services found in this category yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div>
                                    {doctorsLoading && (
                                        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                            Loading specialists...
                                        </div>
                                    )}

                                    {doctorsError && (
                                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {doctorsError}
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {doctors.map((doctor) => {
                                        const selected = selectedDoctor?.id === doctor.id;
                                        return (
                                            <article
                                                key={doctor.id}
                                                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${selected
                                                    ? "border-indigo-300 shadow-md shadow-indigo-100"
                                                    : "border-slate-200 hover:border-indigo-200"
                                                    }`}
                                            >
                                                <div className="relative h-28 bg-slate-100">
                                                    <Image src={doctor.image} alt={doctor.name} fill className="object-cover" />
                                                    <span className="absolute left-3 top-3 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                                        Available
                                                    </span>
                                                </div>

                                                <div className="relative px-4 pb-4 pt-8 text-center">
                                                    <div className="absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-3 border-white bg-slate-200">
                                                        <Image src={doctor.image} alt={`${doctor.name} profile`} fill className="object-cover" />
                                                    </div>

                                                    <p className="text-base font-semibold text-slate-900">{doctor.name}</p>
                                                    <p className="mt-1 text-sm text-slate-600">{doctor.specialty}</p>
                                                    <p className="mt-3 text-xs leading-5 text-slate-500">{doctor.bio}</p>

                                                    <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                                                        {doctor.availability}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedDoctor(doctor)}
                                                        className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold transition ${selected
                                                            ? "bg-[#1a1aaa] text-white"
                                                            : "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                                                            }`}
                                                    >
                                                        {selected ? "Selected Specialist" : "Select Specialist"}
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                    </div>

                                    {!doctorsLoading && doctors.length === 0 && !doctorsError && (
                                        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                            No specialists available right now.
                                        </div>
                                    )}

                                    <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-slate-600">
                                        All specialists listed above are certified in robotic-assisted urology and use structured AI support for diagnostic confidence.
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                    <h4 className="text-2xl font-semibold text-slate-900">Schedule an appointment</h4>

                                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                        <h5 className="text-center text-3xl font-semibold text-slate-800">Choose date</h5>
                                        <p className="mt-2 text-center text-sm text-slate-500">Use the date picker and set your preferred time range</p>

                                        <div className="mx-auto mt-6 max-w-xs">
                                            <label className="grid gap-2 text-sm">
                                                <span className="font-semibold text-slate-700">Appointment Date</span>
                                                <input
                                                    type="date"
                                                    value={selectedDateInput}
                                                    onChange={(event) => setSelectedDateInput(event.target.value)}
                                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none ring-indigo-300 focus:ring"
                                                />
                                            </label>
                                        </div>

                                        <div className="mt-5 rounded-xl bg-sky-100 px-3 py-2 text-center text-xs text-slate-600">
                                            Selected date: <span className="font-semibold text-slate-800">{selectedDate}</span>
                                        </div>

                                        <div className="mt-6">
                                            <p className="text-3xl font-semibold text-slate-900">Time</p>

                                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                {appointmentDurations.map((duration) => {
                                                    const isActive = selectedDuration === duration;
                                                    return (
                                                        <button
                                                            key={duration}
                                                            type="button"
                                                            onClick={() => setSelectedDuration(duration)}
                                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${isActive
                                                                ? "border-indigo-500 bg-indigo-600 text-white"
                                                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                                                                }`}
                                                        >
                                                            {duration}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                                                <select
                                                    value={startTime}
                                                    onChange={(event) => setStartTime(event.target.value)}
                                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none ring-indigo-300 focus:ring"
                                                >
                                                    {timeOptions.map((time) => (
                                                        <option key={`start-${time}`} value={time}>
                                                            {time}
                                                        </option>
                                                    ))}
                                                </select>

                                                <span className="text-center text-slate-400">→</span>

                                                <select
                                                    value={endTime}
                                                    onChange={(event) => setEndTime(event.target.value)}
                                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none ring-indigo-300 focus:ring"
                                                >
                                                    {timeOptions.map((time) => (
                                                        <option key={`end-${time}`} value={time}>
                                                            {time}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mt-4 rounded-xl bg-sky-100 px-3 py-2 text-center text-xs text-slate-600">
                                                Selected time slot: <span className="font-semibold text-slate-800">{selectedSlot?.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {currentStep === 4 && (
                                <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
                                    <label className="grid gap-1 text-sm">
                                        <span className="font-semibold text-slate-700">Full Name</span>
                                        <input
                                            value={fullName}
                                            onChange={(event) => setFullName(event.target.value)}
                                            type="text"
                                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                            placeholder="Enter full name"
                                        />
                                    </label>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="grid gap-1 text-sm">
                                            <span className="font-semibold text-slate-700">Email</span>
                                            <input
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                type="email"
                                                className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                                placeholder="name@email.com"
                                            />
                                        </label>
                                        <label className="grid gap-1 text-sm">
                                            <span className="font-semibold text-slate-700">Phone</span>
                                            <input
                                                value={phone}
                                                onChange={(event) => setPhone(event.target.value)}
                                                type="tel"
                                                className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                                placeholder="0800 000 0000"
                                            />
                                        </label>
                                    </div>
                                    <label className="grid gap-1 text-sm">
                                        <span className="font-semibold text-slate-700">Clinical Notes (Optional)</span>
                                        <textarea
                                            value={notes}
                                            onChange={(event) => setNotes(event.target.value)}
                                            className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-indigo-300 focus:ring"
                                            placeholder="Add symptoms or current concerns"
                                        />
                                    </label>
                                </form>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Service</p>
                                        <p className="mt-1 text-sm text-slate-800">{selectedService?.name ?? "Not selected"}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Specialist</p>
                                        <p className="mt-1 text-sm text-slate-800">{selectedDoctor?.name ?? "Not selected"}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Schedule</p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            {selectedDate} {selectedSlot ? `at ${selectedSlot.label}` : ""}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Patient</p>
                                        <p className="mt-1 text-sm text-slate-800">{fullName || "Not added"}</p>
                                        <p className="text-xs text-slate-500">{email || "No email"}</p>
                                    </div>

                                    {submitError && (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {submitError}
                                        </div>
                                    )}

                                    {!isConfirmed && (
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={confirmBooking}
                                                disabled={!allReady || isSubmitting}
                                                className="w-full rounded-full bg-[#1a1aaa] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Booking..." : "Confirm Appointment"}
                                            </button>
                                        </div>
                                    )}

                                    {isConfirmed && (
                                        <div className="space-y-3">
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                                Appointment booked successfully! A confirmation will be sent to your email. Payment of{" "}
                                                <strong>{selectedService?.price}</strong> has been processed.
                                            </div>
                                            <Link
                                                href="/patient-portal?section=history"
                                                className="block w-full rounded-full border border-indigo-200 bg-white px-5 py-3 text-center text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                View Appointment History
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isConfirmed && (
                            <div className="mt-6 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={moveBack}
                                    disabled={currentStep === 1}
                                    className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={moveNext}
                                    disabled={!canContinue || currentStep === 5}
                                    className="rounded-full bg-[#1a1aaa] px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Continue
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

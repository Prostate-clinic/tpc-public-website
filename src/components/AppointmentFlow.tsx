"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Check, CheckCircle, ClipboardCheck, CreditCard, FileText, Loader2, Stethoscope, UserRound, Video, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePatientAuth } from "@/contexts/PatientAuthContext";

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
    priceRaw: number;
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

type ConsultationType = {
    id: string;
    name: string;
    durationMinutes: number;
    fee: number | string;
    isVideo: boolean;
};

type Branch = {
    id: string;
    name: string;
    timezone: string;
};

type DoctorOption = {
    id: string;
    name: string;
    specialty: string;
    image: string;
    bio: string;
    consultationTypes: ConsultationType[];
    branch: Branch | null;
};

type ApiDoctor = {
    id: string;
    name: string;
    specialty: string;
    bio: string | null;
    image: string | null;
    consultationTypes?: ConsultationType[] | null;
    branch?: Branch | null;
};

/**
 * A slot as the server computed it.
 *
 * `startAt` is an opaque instant: it is posted back verbatim and is never
 * rebuilt from the displayed strings. `startTime`/`endTime` are already
 * clinic-local, so they are what we render — a patient booking from London must
 * see Lagos clinic hours.
 */
type AvailabilitySlot = {
    startAt: string;
    endAt: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
};

type UnavailableReason =
    | "NOT_WORKING"
    | "ON_LEAVE"
    | "HOLIDAY"
    | "FULLY_BOOKED"
    | "DAILY_LIMIT_REACHED"
    | "OUTSIDE_BOOKING_WINDOW"
    | null;

type AvailabilityDay = {
    date: string;
    slots: AvailabilitySlot[];
    reason: UnavailableReason;
};

type BookedAppointment = {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    expiresAt?: string | null;
};

const steps: Step[] = [
    { id: 1, title: "Services", subtitle: "Pick a treatment pathway", icon: Stethoscope },
    { id: 2, title: "Specialist", subtitle: "Choose your clinician", icon: UserRound },
    { id: 3, title: "Consultation", subtitle: "How long you need with the doctor", icon: ClipboardCheck },
    { id: 4, title: "Schedule", subtitle: "Pick from the doctor's open times", icon: CalendarDays },
    { id: 5, title: "Review", subtitle: "Check your appointment details", icon: FileText },
    { id: 6, title: "Payment", subtitle: "Confirm and pay", icon: CreditCard },
];

const serviceCategories = [
    { id: "all", label: "All Services", hint: "Browse every available option" },
    { id: "surgical", label: "Surgical Procedures", hint: "Robotic and minimally invasive" },
    { id: "consultation", label: "Consultation & Assessment", hint: "Clinical evaluation and care planning" },
    { id: "diagnostics", label: "Diagnostics", hint: "Lab and screening pathways" },
    { id: "imaging", label: "Imaging Services", hint: "Advanced MRI and visual analysis" },
] as const;

const FALLBACK_DOCTOR_IMAGE = "/No-Image-Placeholder%20(2).svg";
const DRAFT_KEY = "booking_draft";
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The clinic's "today", not the browser's — they can differ by a day. */
function clinicToday(timeZone?: string) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timeZone || undefined,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function toISODate(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatISODateLong(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) return date;
    // Calendar dates only — constructed in local time purely for its label, never
    // used to derive an instant.
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

/** Empty days carry a reason. Saying why beats saying "no slots". */
function reasonMessage(reason: UnavailableReason, doctorName: string) {
    switch (reason) {
        case "NOT_WORKING":
            return `${doctorName} doesn't hold clinic on this day.`;
        case "ON_LEAVE":
            return `${doctorName} is unavailable on this date.`;
        case "HOLIDAY":
            return "The clinic is closed on this date.";
        case "FULLY_BOOKED":
            return "Fully booked — please try another day.";
        case "DAILY_LIMIT_REACHED":
            return "Fully booked.";
        case "OUTSIDE_BOOKING_WINDOW":
            return "This date can't be booked yet.";
        default:
            return "No open times on this date.";
    }
}

function normalizeServiceCategory(category: ApiService["category"]): ServiceOption["category"] {
    if (category === "SURGICAL") return "surgical";
    if (category === "CONSULTATION") return "consultation";
    if (category === "DIAGNOSTICS") return "diagnostics";
    return "imaging";
}

function formatNaira(value: number | string) {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return "Price on request";
    return `NGN ${numericValue.toLocaleString("en-NG")}`;
}

function formatServicePrice(value: number | string) {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return "Price available on request";
    return `From NGN ${numericValue.toLocaleString("en-NG")}`;
}

function getStepStatus(stepId: number, currentStep: number, highestReached: number) {
    if (stepId === currentStep) return "active";
    if (stepId <= highestReached) return "complete";
    return "pending";
}

/**
 * A PENDING booking holds its slot for 30 minutes, then a cron releases it.
 * Driven by the server's `expiresAt` rather than a client-side `now + 30min`,
 * which would drift away from the deadline actually being enforced.
 */
function HoldCountdown({ expiresAt }: { expiresAt: string }) {
    const deadline = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
    const [remainingMs, setRemainingMs] = useState(() => Math.max(0, deadline - Date.now()));

    useEffect(() => {
        const tick = () => setRemainingMs(Math.max(0, deadline - Date.now()));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    if (!Number.isFinite(deadline)) return null;

    if (remainingMs <= 0) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                This reservation has expired and the time has been released. Please book again.
            </div>
        );
    }

    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">
                Time held for {minutes}:{String(seconds).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs leading-5">
                Your appointment is reserved but not yet confirmed. Complete payment before the timer runs out or the
                slot is released to other patients.
            </p>
        </div>
    );
}

export function AppointmentFlow() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            }
        >
            <AppointmentFlowInner />
        </Suspense>
    );
}

function AppointmentFlowInner() {
    const { patient, token, login } = usePatientAuth();
    const searchParams = useSearchParams();

    const paymentRef = searchParams.get("reference");
    const paymentCode = searchParams.get("code");
    const [paymentSuccess, setPaymentSuccess] = useState<"loading" | "success" | "failed" | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<{ reference?: string } | null>(null);

    const [currentStep, setCurrentStep] = useState(1);
    // The furthest step the user has reached. Clicking a step in the header
    // only jumps backward to completed steps — never forward past where they
    // are. This state starts at 1 and grows as they complete each step.
    const [highestStepReached, setHighestStepReached] = useState(1);
    const [activeServiceCategory, setActiveServiceCategory] = useState<(typeof serviceCategories)[number]["id"]>("all");

    const [services, setServices] = useState<ServiceOption[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState("");
    const [doctors, setDoctors] = useState<DoctorOption[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [doctorsError, setDoctorsError] = useState("");

    const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
    const [selectedConsultation, setSelectedConsultation] = useState<ConsultationType | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [notes, setNotes] = useState("");

    const timezone = selectedDoctor?.branch?.timezone || "";
    const [monthCursor, setMonthCursor] = useState(() => {
        const [year, month] = clinicToday().split("-").map(Number);
        return { year, month: month - 1 };
    });

    const [monthDays, setMonthDays] = useState<Record<string, AvailabilityDay>>({});
    const [monthLoading, setMonthLoading] = useState(false);
    const [monthError, setMonthError] = useState("");

    const [daySlots, setDaySlots] = useState<AvailabilitySlot[]>([]);
    const [dayReason, setDayReason] = useState<UnavailableReason>(null);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState("");
    const [slotTakenNotice, setSlotTakenNotice] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [booked, setBooked] = useState<BookedAppointment | null>(null);
    const [paymentError, setPaymentError] = useState("");

    const [signInEmail, setSignInEmail] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [signInError, setSignInError] = useState("");
    const [signInLoading, setSignInLoading] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);

    /**
     * Who the appointment is for.
     *
     * Booking does NOT require an account. The appointment is tied to this
     * EMAIL, and if the patient later registers with it, the booking is claimed
     * and appears in their history. Signing in is an optional convenience that
     * prefills these fields — never a gate.
     */
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    /**
     * One key per booking attempt, reused across retries: if the patient
     * double-clicks or the connection drops, the server replays the ORIGINAL
     * appointment instead of booking a second one. Picking a different slot is a
     * different attempt, so the key is cleared whenever the selection changes.
     */
    const idempotencyKeyRef = useRef<string | null>(null);
    const bookingKey = () => {
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
        return idempotencyKeyRef.current;
    };

    const stepLabel = useMemo(() => steps.find((step) => step.id === currentStep), [currentStep]);

    // ── Handle payment redirect ─────────────────────────────────────────────
    useEffect(() => {
        if (!paymentRef) return;

        // Cancelled or error code
        if (paymentCode && paymentCode !== "00") {
            setPaymentSuccess("failed");
            return;
        }

        setPaymentSuccess("loading");

        let attempts = 0;
        const maxAttempts = 10;

        const verify = async () => {
            try {
                const res = await fetch(`/api/payments/verify/${encodeURIComponent(paymentRef)}`);
                const data = await res.json();

                if (data.verified && data.status === 2) {
                    setPaymentSuccess("success");
                    setPaymentDetails({ reference: data.providerReference });
                    return;
                }

                if (data.status >= 400) {
                    setPaymentSuccess("failed");
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(verify, 3000);
                } else {
                    setPaymentSuccess("failed");
                }
            } catch {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(verify, 3000);
                } else {
                    setPaymentSuccess("failed");
                }
            }
        };

        verify();
    }, [paymentRef, paymentCode]);

    const filteredServices = useMemo(() => {
        if (activeServiceCategory === "all") return services;
        return services.filter((service) => service.category === activeServiceCategory);
    }, [activeServiceCategory, services]);

    const isAuthenticated = Boolean(patient && token);

    /** Signing in prefills the patient's details — it never gates the booking. */
    useEffect(() => {
        if (!patient) return;
        setContactName((current) => current || patient.name || "");
        setContactEmail((current) => current || patient.email || "");
        setContactPhone((current) => current || patient.phone || "");
        setShowSignIn(false);
    }, [patient]);

    const contactValid =
        contactName.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());

    const canContinue = useMemo(() => {
        if (currentStep === 1) return Boolean(selectedService);
        if (currentStep === 2) return Boolean(selectedDoctor);
        if (currentStep === 3) return Boolean(selectedConsultation);
        if (currentStep === 4) return Boolean(selectedSlot);
        if (currentStep === 5) return contactValid;
        return false;
    }, [currentStep, selectedService, selectedDoctor, selectedConsultation, selectedSlot, contactValid]);

    // ── Draft: survives the trip to /register and back ───────────────────────
    useEffect(() => {
        if (!selectedService && !selectedDoctor) return;
        sessionStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                serviceId: selectedService?.id ?? null,
                doctorId: selectedDoctor?.id ?? null,
                consultationTypeId: selectedConsultation?.id ?? null,
                date: selectedDate || null,
            }),
        );
    }, [selectedService, selectedDoctor, selectedConsultation, selectedDate]);

    // Rehydrate once both lists are in — the draft holds ids, not objects.
    const draftApplied = useRef(false);
    useEffect(() => {
        if (draftApplied.current || servicesLoading || doctorsLoading) return;
        draftApplied.current = true;

        let draft: { serviceId?: string; doctorId?: string; consultationTypeId?: string; date?: string } | null = null;
        try {
            const stored = sessionStorage.getItem(DRAFT_KEY);
            if (stored) draft = JSON.parse(stored);
        } catch {
            return;
        }
        if (!draft) return;

        const service = services.find((item) => item.id === draft.serviceId) ?? null;
        const doctor = doctors.find((item) => item.id === draft.doctorId) ?? null;
        const consultation = doctor?.consultationTypes.find((item) => item.id === draft.consultationTypeId) ?? null;

        if (service) setSelectedService(service);
        if (doctor) setSelectedDoctor(doctor);
        if (consultation) setSelectedConsultation(consultation);
        if (draft.date) setSelectedDate(draft.date);

        if (service && doctor && consultation) {
            setCurrentStep(4);
            setHighestStepReached(4);
        }
        else if (service && doctor) {
            setCurrentStep(3);
            setHighestStepReached(3);
        }
        else if (service) {
            setCurrentStep(2);
            setHighestStepReached(2);
        }
    }, [services, doctors, servicesLoading, doctorsLoading]);

    useEffect(() => {
        let isMounted = true;

        const loadServices = async () => {
            setServicesLoading(true);
            setServicesError("");

            try {
                const response = await fetch("/api/services");
                if (!response.ok) throw new Error("Unable to load services right now.");

                const payload = await response.json();
                const records: ApiService[] = Array.isArray(payload?.services) ? payload.services : [];

                const mappedServices: ServiceOption[] = records.map((service) => ({
                    id: service.id,
                    category: normalizeServiceCategory(service.category),
                    name: service.name,
                    duration: `${service.duration} min`,
                    price: formatServicePrice(service.price),
                    priceRaw: Number(service.price) || 0,
                    blurb: service.description || "Specialist-led treatment pathway tailored for high-confidence outcomes.",
                    focus:
                        Array.isArray(service.focus) && service.focus.length > 0
                            ? service.focus
                            : ["Consult specialist", "Tailored treatment plan", "Coordinated follow-up"],
                }));

                if (isMounted) setServices(mappedServices);
            } catch (error) {
                if (isMounted) {
                    setServicesError(error instanceof Error ? error.message : "Unable to load services right now.");
                    setServices([]);
                }
            } finally {
                if (isMounted) setServicesLoading(false);
            }
        };

        loadServices();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadDoctors = async () => {
            setDoctorsLoading(true);
            setDoctorsError("");

            try {
                const response = await fetch("/api/doctors");
                if (!response.ok) throw new Error("Unable to load specialists right now.");

                const payload = await response.json();
                const records: ApiDoctor[] = Array.isArray(payload?.doctors) ? payload.doctors : [];

                const mappedDoctors: DoctorOption[] = records.map((doctor) => ({
                    id: doctor.id,
                    name: doctor.name,
                    specialty: doctor.specialty,
                    image: doctor.image || FALLBACK_DOCTOR_IMAGE,
                    bio:
                        doctor.bio ||
                        "Experienced specialist delivering evidence-based urologic care with a patient-first approach.",
                    consultationTypes: Array.isArray(doctor.consultationTypes) ? doctor.consultationTypes : [],
                    branch: doctor.branch ?? null,
                }));

                if (isMounted) setDoctors(mappedDoctors);
            } catch (error) {
                if (isMounted) {
                    setDoctorsError(error instanceof Error ? error.message : "Unable to load specialists right now.");
                    setDoctors([]);
                }
            } finally {
                if (isMounted) setDoctorsLoading(false);
            }
        };

        loadDoctors();
        return () => {
            isMounted = false;
        };
    }, []);

    // ── Availability ─────────────────────────────────────────────────────────

    /**
     * The calendar. Availability is per consultation type, so a change of type
     * reshapes the whole month: a 15-minute follow-up fits into gaps a 45-minute
     * review cannot.
     */
    useEffect(() => {
        // Availability is PUBLIC. Gating it on a token was what forced a login
        // before the patient could even see what was free.
        if (!selectedDoctor || !selectedConsultation) return;

        let isMounted = true;
        const controller = new AbortController();

        const loadMonth = async () => {
            setMonthLoading(true);
            setMonthError("");

            const today = clinicToday(timezone);
            const firstOfMonth = toISODate(monthCursor.year, monthCursor.month, 1);
            const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
            const lastOfMonth = toISODate(monthCursor.year, monthCursor.month, daysInMonth);

            // Never ask for days already in the past — the engine would only
            // return them as unbookable anyway.
            const from = firstOfMonth < today ? today : firstOfMonth;
            if (from > lastOfMonth) {
                if (isMounted) {
                    setMonthDays({});
                    setMonthLoading(false);
                }
                return;
            }

            try {
                const query = new URLSearchParams({
                    doctorId: selectedDoctor.id,
                    consultationTypeId: selectedConsultation.id,
                    from,
                    to: lastOfMonth,
                });

                const response = await fetch(`/api/availability/range?${query}`, {
                    signal: controller.signal,
                });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload?.message || "Unable to load the calendar.");

                const days: AvailabilityDay[] = Array.isArray(payload?.days) ? payload.days : [];
                const byDate: Record<string, AvailabilityDay> = {};
                for (const day of days) byDate[day.date] = day;

                if (isMounted) setMonthDays(byDate);
            } catch (error) {
                if (isMounted && !controller.signal.aborted) {
                    setMonthError(error instanceof Error ? error.message : "Unable to load the calendar.");
                    setMonthDays({});
                }
            } finally {
                if (isMounted) setMonthLoading(false);
            }
        };

        loadMonth();
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [selectedDoctor, selectedConsultation, monthCursor, timezone]);

    /**
     * The authoritative slot list for the chosen day. The calendar's range data
     * could serve this, but it ages: re-fetching on selection (and after a 409)
     * is what keeps the patient from clicking a slot that went while they read
     * the page.
     */
    const loadDaySlots = useCallback(async () => {
        if (!selectedDoctor || !selectedConsultation || !selectedDate) return;

        setSlotsLoading(true);
        setSlotsError("");
        setDaySlots([]);
        setDayReason(null);
        setSelectedSlot(null);

        try {
            const query = new URLSearchParams({
                doctorId: selectedDoctor.id,
                consultationTypeId: selectedConsultation.id,
                date: selectedDate,
            });

            const response = await fetch(`/api/availability?${query}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message || "Unable to load times for this date.");

            setDaySlots(Array.isArray(payload?.slots) ? payload.slots : []);
            setDayReason(payload?.reason ?? null);
        } catch (error) {
            setSlotsError(error instanceof Error ? error.message : "Unable to load times for this date.");
            setDaySlots([]);
            setDayReason(null);
        } finally {
            setSlotsLoading(false);
        }
    }, [selectedDoctor, selectedConsultation, selectedDate, token]);

    useEffect(() => {
        if (!selectedDate) {
            setDaySlots([]);
            setDayReason(null);
            return;
        }
        loadDaySlots();
    }, [selectedDate, loadDaySlots]);

    // ── Selection cascade: a change upstream invalidates everything downstream ──
    const chooseDoctor = (doctor: DoctorOption) => {
        setSelectedDoctor(doctor);
        setSelectedConsultation(null);
        setSelectedDate("");
        setSelectedSlot(null);
        idempotencyKeyRef.current = null;
    };

    const chooseConsultation = (consultation: ConsultationType) => {
        setSelectedConsultation(consultation);
        setSelectedDate("");
        setSelectedSlot(null);
        idempotencyKeyRef.current = null;
    };

    const chooseDate = (date: string) => {
        setSelectedDate(date);
        setSelectedSlot(null);
        setSlotTakenNotice("");
        idempotencyKeyRef.current = null;
    };

    const chooseSlot = (slot: AvailabilitySlot) => {
        setSelectedSlot(slot);
        setSlotTakenNotice("");
        idempotencyKeyRef.current = null;
    };

    const calendarCells = useMemo(() => {
        const firstWeekday = new Date(monthCursor.year, monthCursor.month, 1).getDay();
        const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();

        const cells: Array<{ date: string; day: number } | null> = Array(firstWeekday).fill(null);
        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push({ date: toISODate(monthCursor.year, monthCursor.month, day), day });
        }
        return cells;
    }, [monthCursor]);

    const monthTitle = useMemo(
        () =>
            new Date(monthCursor.year, monthCursor.month, 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            }),
        [monthCursor],
    );

    const shiftMonth = (delta: number) => {
        setMonthCursor((prev) => {
            const next = new Date(prev.year, prev.month + delta, 1);
            return { year: next.getFullYear(), month: next.getMonth() };
        });
    };

    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (signInLoading) return;

        setSignInLoading(true);
        setSignInError("");

        try {
            const response = await fetch("/api/patients/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: signInEmail, password: signInPassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "Unable to sign in.");

            login(data.access_token, data.patient);
            setSignInPassword("");
        } catch (error) {
            setSignInError(error instanceof Error ? error.message : "Unable to sign in.");
        } finally {
            setSignInLoading(false);
        }
    };

    const moveNext = () => {
        if (!canContinue || currentStep >= 6) return;
        setCurrentStep((prev) => {
            const next = prev + 1;
            setHighestStepReached((h) => Math.max(h, next));
            return next;
        });
    };

    const moveBack = () => {
        if (currentStep <= 1) return;
        setCurrentStep((prev) => prev - 1);
    };

    const confirmBooking = async () => {
        if (!selectedDoctor || !selectedConsultation || !selectedSlot || isSubmitting) return;
        if (!contactValid) return;

        setIsSubmitting(true);
        setSubmitError("");
        setPaymentError("");

        try {
            let appointmentId: string;

            if (booked) {
                // Retry: appointment already created, just re-initiate payment
                appointmentId = booked.id;
            } else {
                // Fresh booking
                const response = await fetch("/api/appointments", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        "x-idempotency-key": bookingKey(),
                    },
                    body: JSON.stringify({
                        doctorId: selectedDoctor.id,
                        consultationTypeId: selectedConsultation.id,
                        startAt: selectedSlot.startAt,
                        contactName: contactName.trim(),
                        contactEmail: contactEmail.trim(),
                        contactPhone: contactPhone.trim() || undefined,
                        serviceId: selectedService?.id,
                        notes: notes.trim() || undefined,
                    }),
                });

                const payload = await response.json();

                if (response.status === 409) {
                    idempotencyKeyRef.current = null;
                    setSelectedSlot(null);
                    setSlotTakenNotice("That time was just taken. Here are the times still open.");
                    setCurrentStep(4);
                    await loadDaySlots();
                    return;
                }

                if (!response.ok) {
                    throw new Error(payload?.message || "Unable to book this appointment.");
                }

                const appointment = payload.appointment as BookedAppointment;
                setBooked(appointment);
                sessionStorage.removeItem(DRAFT_KEY);
                appointmentId = appointment.id;
            }

            // Initiate payment and redirect to payment page
            const payRes = await fetch(`/api/payments/initiate/${appointmentId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const payData = await payRes.json();

            if (payRes.ok && payData.paymentLink) {
                window.location.href = payData.paymentLink;
                return;
            }

            // Payment initiation failed
            setPaymentError(payData?.message || "Unable to start payment. Please try again.");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const doctorLabel = selectedDoctor?.name ?? "This specialist";

    return (
        <section className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-6 lg:px-8 lg:pb-24">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-0 top-24 h-48 w-48 rounded-full bg-cyan-200/50 blur-3xl" />
                <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-indigo-200/60 blur-3xl" />
            </div>

            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">Appointment Flow</p>
                <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                    Choose a service and a specialist, then reserve one of the times the clinic actually has open.
                </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
                <div className="overflow-x-auto pb-3 scrollbar-hide">
                    <div className="flex min-w-205 items-start px-2 pt-1">
                        {steps.map((step, index) => {
                            const status = getStepStatus(step.id, currentStep, highestStepReached);
                            const StepIcon = step.icon;
                            return (
                                <div key={step.id} className="flex flex-1 items-start">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Allow only backward navigation to completed steps.
                                            // Forward jumps are blocked: the user must complete
                                            // each step before advancing to the next.
                                            if (step.id <= currentStep) {
                                                setCurrentStep(step.id);
                                            }
                                        }}
                                        disabled={Boolean(booked) || step.id > currentStep}
                                        className="group flex min-w-32.5 flex-col items-center text-center transition disabled:cursor-not-allowed"
                                        aria-current={status === "active" ? "step" : undefined}
                                    >
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${status === "pending"
                                                ? "border-slate-200 bg-slate-100 text-slate-500"
                                                : "border-indigo-700 bg-indigo-700 text-white"
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

                <div className="mt-6 relative">
                    <div className="rounded-3xl border border-slate-200 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Step {currentStep}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{stepLabel?.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{stepLabel?.subtitle}</p>

                        <div className="mt-6">
                            {/* ── Payment success/failed screen ─────────────────────── */}
                            {paymentSuccess && (
                                <div className="space-y-4">
                                    {paymentSuccess === "loading" && (
                                        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                                            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                                            <div>
                                                <h4 className="text-lg font-semibold text-slate-900">Confirming your payment...</h4>
                                                <p className="mt-1 text-sm text-slate-600">Please wait while we verify your transaction.</p>
                                            </div>
                                        </div>
                                    )}

                                    {paymentSuccess === "success" && (
                                        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-8 text-center">
                                            <CheckCircle className="h-14 w-14 text-emerald-600" />
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900">Payment Confirmed!</h4>
                                                <p className="mt-2 text-sm text-slate-600">
                                                    Your appointment has been confirmed. You will receive a confirmation email shortly.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 pt-2 w-full max-w-xs">
                                                <Link
                                                    href="/patient-portal?section=history"
                                                    className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                                                >
                                                    View My Appointments
                                                </Link>
                                                <Link
                                                    href="/"
                                                    className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    Back to Home
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {paymentSuccess === "failed" && (
                                        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white p-8 text-center">
                                            <XCircle className="h-14 w-14 text-red-600" />
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900">Payment Not Completed</h4>
                                                <p className="mt-2 text-sm text-slate-600">
                                                    Your payment was not completed. If you were charged, please contact support.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 pt-2 w-full max-w-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPaymentSuccess(null);
                                                        setPaymentError("");
                                                        setBooked(null);
                                                    }}
                                                    className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                                                >
                                                    Try Again
                                                </button>
                                                <Link
                                                    href="/"
                                                    className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    Back to Home
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 1: service ─────────────────────────────────── */}
                            {!paymentSuccess && currentStep === 1 && (
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
                                                        <p className={`text-sm font-semibold ${isActive ? "text-indigo-700" : "text-slate-900"}`}>
                                                            {category.label}
                                                        </p>
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
                                                            <span
                                                                key={item}
                                                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                                                            >
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

                            {/* ── Step 2: specialist ──────────────────────────────── */}
                            {!paymentSuccess && currentStep === 2 && (
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
                                                    </div>

                                                    <div className="relative px-4 pb-4 pt-8 text-center">
                                                        <div className="absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-3 border-white bg-slate-200">
                                                            <Image src={doctor.image} alt={`${doctor.name} profile`} fill className="object-cover" />
                                                        </div>

                                                        <p className="text-base font-semibold text-slate-900">{doctor.name}</p>
                                                        <p className="mt-1 text-sm text-slate-600">{doctor.specialty}</p>
                                                        <p className="mt-3 text-xs leading-5 text-slate-500">{doctor.bio}</p>

                                                        {doctor.branch && (
                                                            <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                                                                {doctor.branch.name}
                                                            </p>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => chooseDoctor(doctor)}
                                                            disabled={doctor.consultationTypes.length === 0}
                                                            className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${selected
                                                                ? "bg-[#1a1aaa] text-white"
                                                                : "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                                                                }`}
                                                        >
                                                            {doctor.consultationTypes.length === 0
                                                                ? "Not accepting bookings"
                                                                : selected
                                                                    ? "Selected Specialist"
                                                                    : "Select Specialist"}
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
                                </div>
                            )}

                            {/* ── Step 3: consultation type ───────────────────────── */}
                            {!paymentSuccess && currentStep === 3 && (
                                <div>
                                    {!selectedDoctor ? (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                            Choose a specialist first.
                                        </div>
                                    ) : (
                                        <>
                                            <p className="mb-4 text-sm text-slate-600">
                                                The type of consultation sets how long you get with {doctorLabel} — and therefore which
                                                times are open.
                                            </p>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {selectedDoctor.consultationTypes.map((consultation) => {
                                                    const selected = selectedConsultation?.id === consultation.id;
                                                    const isVideoDisabled = consultation.isVideo;
                                                    return (
                                                        <button
                                                            key={consultation.id}
                                                            type="button"
                                                            onClick={() => !isVideoDisabled && chooseConsultation(consultation)}
                                                            disabled={isVideoDisabled}
                                                            className={`rounded-2xl border p-4 text-left transition ${isVideoDisabled
                                                                ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                                                                : selected
                                                                    ? "border-indigo-300 bg-indigo-50/60 shadow-md shadow-indigo-100"
                                                                    : "border-slate-200 bg-white hover:border-indigo-200"
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <p className="text-base font-semibold text-slate-900">{consultation.name}</p>
                                                                {consultation.isVideo && (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                                        <Video className="h-3 w-3" /> Coming soon
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                                                                    {consultation.durationMinutes} min
                                                                </span>
                                                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                                                                    {formatNaira(consultation.fee)}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {selectedDoctor.consultationTypes.length === 0 && (
                                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                                    {doctorLabel} has no consultation types set up yet.
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── Step 4: schedule (auth-gated) ───────────────────── */}
                            {!paymentSuccess && currentStep === 4 && (
                                <div>
                                    {showSignIn && !isAuthenticated ? (
                                        // OPTIONAL. Booking never requires an account — this panel only
                                        // appears if the patient asks for it, to prefill their details.
                                        <div className="mx-auto max-w-md rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
                                            <h4 className="text-lg font-semibold text-slate-900">Sign in to prefill your details</h4>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                You do not need an account to book — this only saves you typing. Your choices are kept.
                                            </p>

                                            <form className="mt-5 grid gap-3" onSubmit={handleSignIn}>
                                                <label className="grid gap-1 text-sm">
                                                    <span className="font-semibold text-slate-700">Email</span>
                                                    <input
                                                        value={signInEmail}
                                                        onChange={(event) => setSignInEmail(event.target.value)}
                                                        type="email"
                                                        required
                                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                                        placeholder="name@email.com"
                                                    />
                                                </label>
                                                <label className="grid gap-1 text-sm">
                                                    <span className="font-semibold text-slate-700">Password</span>
                                                    <input
                                                        value={signInPassword}
                                                        onChange={(event) => setSignInPassword(event.target.value)}
                                                        type="password"
                                                        required
                                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                                        placeholder="••••••••"
                                                    />
                                                </label>

                                                {signInError && (
                                                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{signInError}</p>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={signInLoading}
                                                    className="mt-1 w-full rounded-full bg-[#1a1aaa] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#111188] disabled:opacity-50"
                                                >
                                                    {signInLoading ? "Signing in..." : "Sign In"}
                                                </button>
                                            </form>

                                            <p className="mt-4 text-center text-sm text-slate-600">
                                                New patient?{" "}
                                                <Link href="/register" className="font-semibold text-indigo-700 hover:underline">
                                                    Create an account
                                                </Link>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowSignIn(false)}
                                                className="mt-3 w-full text-center text-sm font-semibold text-slate-500 hover:underline"
                                            >
                                                Continue without an account
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
                                            {/* Calendar */}
                                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => shiftMonth(-1)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                                                        aria-label="Previous month"
                                                    >
                                                        ‹
                                                    </button>
                                                    <p className="text-sm font-semibold text-slate-900">{monthTitle}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => shiftMonth(1)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                                                        aria-label="Next month"
                                                    >
                                                        ›
                                                    </button>
                                                </div>

                                                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
                                                    {WEEKDAY_LABELS.map((label) => (
                                                        <span key={label}>{label[0]}</span>
                                                    ))}
                                                </div>

                                                <div className="mt-1 grid grid-cols-7 gap-1">
                                                    {calendarCells.map((cell, index) => {
                                                        if (!cell) return <span key={`pad-${index}`} />;

                                                        const day = monthDays[cell.date];
                                                        // A day is dead if the engine returned it with no slots, or
                                                        // never returned it at all (i.e. it is in the past).
                                                        const isOpen = Boolean(day && day.slots.length > 0);
                                                        const isSelected = selectedDate === cell.date;

                                                        return (
                                                            <button
                                                                key={cell.date}
                                                                type="button"
                                                                onClick={() => chooseDate(cell.date)}
                                                                disabled={!isOpen}
                                                                title={
                                                                    isOpen
                                                                        ? `${day!.slots.length} open`
                                                                        : reasonMessage(day?.reason ?? null, doctorLabel)
                                                                }
                                                                className={`aspect-square rounded-lg text-sm font-medium transition ${isSelected
                                                                    ? "bg-[#1a1aaa] text-white"
                                                                    : isOpen
                                                                        ? "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                                                                        : "cursor-not-allowed text-slate-300"
                                                                    }`}
                                                            >
                                                                {cell.day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {monthLoading && <p className="mt-3 text-xs text-slate-500">Loading the calendar...</p>}
                                                {monthError && <p className="mt-3 text-xs text-red-600">{monthError}</p>}

                                                <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-indigo-100" />
                                                        Available
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-slate-200" />
                                                        Unavailable
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Slots */}
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                {slotTakenNotice && (
                                                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                        {slotTakenNotice}
                                                    </div>
                                                )}

                                                {!selectedDate ? (
                                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                                        <CalendarDays className="h-8 w-8 text-slate-300" />
                                                        <p className="mt-3 text-sm font-medium text-slate-700">Pick a date to see open times</p>
                                                        <p className="mt-1 text-xs text-slate-400">Available days are highlighted on the calendar</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {formatISODateLong(selectedDate)}
                                                            </p>
                                                            {timezone && (
                                                                <p className="text-xs text-slate-500">
                                                                    Times shown in clinic time ({timezone})
                                                                </p>
                                                            )}
                                                        </div>

                                                        {slotsLoading && (
                                                            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                                                                Loading times...
                                                            </div>
                                                        )}

                                                        {slotsError && (
                                                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                                                {slotsError}
                                                            </div>
                                                        )}

                                                        {!slotsLoading && !slotsError && daySlots.length === 0 && (
                                                            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                                                                {reasonMessage(dayReason, doctorLabel)}
                                                            </div>
                                                        )}

                                                        {daySlots.length > 0 && (
                                                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                                {daySlots.map((slot) => {
                                                                    const selected = selectedSlot?.startAt === slot.startAt;
                                                                    return (
                                                                        <button
                                                                            key={slot.startAt}
                                                                            type="button"
                                                                            onClick={() => chooseSlot(slot)}
                                                                            className={`group relative rounded-xl border px-3 py-3 text-left transition ${selected
                                                                                ? "border-indigo-500 bg-[#1a1aaa] text-white ring-2 ring-indigo-200"
                                                                                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:shadow-sm"
                                                                                }`}
                                                                        >
                                                                            <span className="block text-sm font-semibold">{slot.startTime} – {slot.endTime}</span>
                                                                            <span className={`mt-0.5 block text-[11px] ${selected ? "text-indigo-200" : "text-slate-400"}`}>
                                                                                {slot.durationMinutes} min
                                                                            </span>
                                                                            {selected && (
                                                                                <Check className="absolute right-2 top-2 h-4 w-4 text-white" />
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {selectedSlot && (
                                                            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                                                                <span className="font-semibold">Selected:</span>{" "}
                                                                {formatISODateLong(selectedDate)},{" "}
                                                                {selectedSlot.startTime} – {selectedSlot.endTime}
                                                                <span className="ml-2 text-xs text-indigo-500">({selectedSlot.durationMinutes} min)</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 5: confirm ─────────────────────────────────── */}
                            {!paymentSuccess && currentStep === 5 && (
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
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Consultation</p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            {selectedConsultation
                                                ? `${selectedConsultation.name} · ${selectedConsultation.durationMinutes} min · ${formatNaira(
                                                    selectedConsultation.fee,
                                                )}`
                                                : "Not selected"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Time</p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            {selectedDate && selectedSlot
                                                ? `${formatISODateLong(selectedDate)}, ${selectedSlot.startTime} – ${selectedSlot.endTime}`
                                                : "Not selected"}
                                        </p>
                                        {timezone && <p className="mt-1 text-xs text-slate-500">Clinic time ({timezone})</p>}
                                    </div>
                                    {/*
                                      * Your details. No account needed.
                                      *
                                      * The appointment is tied to this EMAIL. If the patient later registers
                                      * with the same address the booking is claimed automatically and shows
                                      * up in their history -- which is why the field is required, and why it
                                      * is worth telling them so.
                                      */}
                                    {!booked && (
                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Your details</p>
                                                {!isAuthenticated && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowSignIn(true);
                                                            setCurrentStep(4);
                                                        }}
                                                        className="text-xs font-semibold text-indigo-700 hover:underline"
                                                    >
                                                        Have an account? Sign in
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                <label className="grid gap-1 text-sm sm:col-span-2">
                                                    <span className="font-semibold text-slate-700">Full name</span>
                                                    <input
                                                        value={contactName}
                                                        onChange={(event) => setContactName(event.target.value)}
                                                        required
                                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                                        placeholder="Ada Obi"
                                                    />
                                                </label>
                                                <label className="grid gap-1 text-sm">
                                                    <span className="font-semibold text-slate-700">Email</span>
                                                    <input
                                                        value={contactEmail}
                                                        onChange={(event) => setContactEmail(event.target.value)}
                                                        type="email"
                                                        required
                                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                                        placeholder="name@email.com"
                                                    />
                                                </label>
                                                <label className="grid gap-1 text-sm">
                                                    <span className="font-semibold text-slate-700">Phone (optional)</span>
                                                    <input
                                                        value={contactPhone}
                                                        onChange={(event) => setContactPhone(event.target.value)}
                                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none ring-indigo-300 focus:ring"
                                                        placeholder="0803 000 0000"
                                                    />
                                                </label>
                                            </div>

                                            <p className="mt-2 text-xs text-slate-500">
                                                We send your confirmation and reference number here. Create an account with this
                                                email later and this appointment appears in your history automatically.
                                            </p>
                                        </div>
                                    )}

                                    {booked && (
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Patient</p>
                                            <p className="mt-1 text-sm text-slate-800">{contactName}</p>
                                            <p className="text-xs text-slate-500">{contactEmail}</p>
                                        </div>
                                    )}

                                    {!booked && (
                                        <label className="grid gap-1 text-sm">
                                            <span className="font-semibold text-slate-700">Clinical Notes (Optional)</span>
                                            <textarea
                                                value={notes}
                                                onChange={(event) => setNotes(event.target.value)}
                                                maxLength={2000}
                                                className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-indigo-300 focus:ring"
                                                placeholder="Add symptoms or current concerns"
                                            />
                                        </label>
                                    )}

                                    {/* Amount to pay */}
                                    {selectedConsultation && (
                                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-700">Amount to pay</span>
                                                <span className="text-lg font-bold text-indigo-700">
                                                    {formatNaira(selectedConsultation.fee)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {submitError && (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {submitError}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 6: payment summary ──────────────────────────────── */}
                            {!paymentSuccess && currentStep === 6 && (
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
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Consultation</p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            {selectedConsultation
                                                ? `${selectedConsultation.name} · ${selectedConsultation.durationMinutes} min`
                                                : "Not selected"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date & Time</p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            {selectedDate && selectedSlot
                                                ? `${formatISODateLong(selectedDate)}, ${selectedSlot.startTime} – ${selectedSlot.endTime}`
                                                : "Not selected"}
                                        </p>
                                        {timezone && <p className="mt-1 text-xs text-slate-500">Clinic time ({timezone})</p>}
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Patient</p>
                                        <p className="mt-1 text-sm text-slate-800">{contactName}</p>
                                        <p className="text-xs text-slate-500">{contactEmail}</p>
                                        {contactPhone && <p className="text-xs text-slate-500">{contactPhone}</p>}
                                    </div>

                                    {/* Payment breakdown */}
                                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 font-semibold">Payment Summary</p>
                                        {selectedService && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">{selectedService.name}</span>
                                                <span className="font-medium text-slate-800">{formatNaira(selectedService.priceRaw)}</span>
                                            </div>
                                        )}
                                        {selectedConsultation && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Consultation fee</span>
                                                <span className="font-medium text-slate-800">{formatNaira(selectedConsultation.fee)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-indigo-200 pt-2 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-700">Total</span>
                                            <span className="text-xl font-bold text-indigo-700">
                                                {formatNaira((selectedService?.priceRaw || 0) + (Number(selectedConsultation?.fee) || 0))}
                                            </span>
                                        </div>
                                    </div>

                                    {submitError && (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {submitError}
                                        </div>
                                    )}

                                    {!booked && (
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={confirmBooking}
                                                disabled={!selectedSlot || !contactValid || isSubmitting}
                                                className="w-full rounded-full bg-[#1a1aaa] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Processing..." : "Proceed to Payment"}
                                            </button>
                                        </div>
                                    )}

                                    {booked && paymentError && (
                                        <div className="space-y-3">
                                            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                {paymentError}
                                            </div>

                                            {booked.expiresAt && <HoldCountdown expiresAt={booked.expiresAt} />}

                                            <button
                                                type="button"
                                                onClick={confirmBooking}
                                                disabled={isSubmitting}
                                                className="w-full rounded-full bg-[#1a1aaa] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#111188] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Processing..." : "Try Again"}
                                            </button>

                                            <Link
                                                href="/patient-portal?section=history"
                                                className="block w-full rounded-full border border-indigo-200 bg-white px-5 py-3 text-center text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                View My Appointments
                                            </Link>
                                        </div>
                                    )}

                                    {booked && !paymentError && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                                <p className="text-sm font-medium text-indigo-800">Redirecting you to payment...</p>
                                            </div>

                                            {booked.expiresAt && <HoldCountdown expiresAt={booked.expiresAt} />}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!paymentSuccess && !booked && currentStep < 6 && (
                            <div className="mt-6 sticky bottom-0 -mx-5 px-5 pb-5 pt-4 -mb-5 bg-white/95 backdrop-blur-sm z-10 border-t border-slate-100">
                                <div className="flex items-center justify-between gap-3">
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
                                    disabled={!canContinue}
                                    className="rounded-full bg-[#1a1aaa] px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </section>
    );
}

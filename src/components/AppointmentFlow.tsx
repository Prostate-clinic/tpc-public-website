"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, ClipboardList, FileText, Loader2, Paperclip, Video, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePatientAuth } from "@/contexts/PatientAuthContext";

type Step = {
    id: number;
    title: string;
    subtitle: string;
    icon: LucideIcon;
};

type ConsultationType = {
    id: string;
    name: string;
    slug: string;
    durationMinutes: number;
    fee: number | string;
    currency: string;
    isVideo: boolean;
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
    | "NO_DOCTORS_AVAILABLE"
    | null;

type AvailabilityDay = {
    date: string;
    slots: AvailabilitySlot[];
    reason: UnavailableReason;
};

type BookedAppointment = {
    id: string;
    referenceNumber: string;
    status: string;
    startAt: string;
    endAt: string;
    expiresAt?: string | null;
};

const steps: Step[] = [
    { id: 1, title: "Your Details", subtitle: "Who the appointment is for", icon: FileText },
    { id: 2, title: "Schedule", subtitle: "Pick an open time", icon: CalendarDays },
    { id: 3, title: "Confirm", subtitle: "Check and book", icon: ClipboardList },
];

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
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

/** Empty days carry a reason. Saying why beats saying "no slots". */
function reasonMessage(reason: UnavailableReason) {
    switch (reason) {
        case "NOT_WORKING":
        case "ON_LEAVE":
            return "No open times with our specialists on this date.";
        case "HOLIDAY":
            return "The clinic is closed on this date.";
        case "FULLY_BOOKED":
            return "Fully booked — please try another day.";
        case "DAILY_LIMIT_REACHED":
            return "Fully booked.";
        case "OUTSIDE_BOOKING_WINDOW":
            return "This date can't be booked yet.";
        case "NO_DOCTORS_AVAILABLE":
            return "No specialist is available for this consultation right now.";
        default:
            return "No open times on this date.";
    }
}

function formatNaira(value: number | string) {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) return "Price on request";
    return `NGN ${numericValue.toLocaleString("en-NG")}`;
}

function getStepStatus(stepId: number, currentStep: number, highestReached: number) {
    if (stepId === currentStep) return "active";
    if (stepId <= highestReached) return "complete";
    return "pending";
}

/**
 * A PENDING booking holds its slot for 30 minutes, then a cron releases it.
 * Driven by the server's `expiresAt` rather than a client-side `now + 30min`.
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
    const { patient, token } = usePatientAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [highestStepReached, setHighestStepReached] = useState(1);

    const timezone = "Africa/Lagos";

    // Contact details (Step 1). Booking does NOT require an account — the
    // appointment is tied to this EMAIL and claimed later on registration.
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    // Consultation type (Step 1): the only required selection besides a slot.
    const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
    const [consultationTypesLoading, setConsultationTypesLoading] = useState(true);
    const [consultationTypesError, setConsultationTypesError] = useState("");
    const [selectedConsultation, setSelectedConsultation] = useState<ConsultationType | null>(null);

    // Optional medical note upload (Step 1).
    const [medicalNoteUrl, setMedicalNoteUrl] = useState("");
    const [medicalNoteName, setMedicalNoteName] = useState("");
    const [noteUploading, setNoteUploading] = useState(false);
    const [noteUploadError, setNoteUploadError] = useState("");

    // Clinical notes.
    const [notes, setNotes] = useState("");

    // Schedule (Step 2) — doctorless: merged availability across every doctor.
    const [monthCursor, setMonthCursor] = useState(() => {
        const [year, month] = clinicToday().split("-").map(Number);
        return { year, month: month - 1 };
    });
    const [monthDays, setMonthDays] = useState<Record<string, AvailabilityDay>>({});
    const [monthLoading, setMonthLoading] = useState(false);
    const [monthError, setMonthError] = useState("");

    const [selectedDate, setSelectedDate] = useState("");
    const [daySlots, setDaySlots] = useState<AvailabilitySlot[]>([]);
    const [dayReason, setDayReason] = useState<UnavailableReason>(null);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState("");
    const [slotTakenNotice, setSlotTakenNotice] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

    // Booking + payment.
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [booked, setBooked] = useState<BookedAppointment | null>(null);

    const idempotencyKeyRef = useRef<string | null>(null);
    const bookingKey = () => {
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
        return idempotencyKeyRef.current;
    };

    const stepLabel = useMemo(() => steps.find((step) => step.id === currentStep), [currentStep]);

    const isAuthenticated = Boolean(patient && token);

    function validateFullName(value: string): string | null {
        const trimmed = value.trim();
        if (!trimmed) return "Full name is required.";
        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length < 2) return "Please enter your full name (first and last name).";
        if (trimmed.length < 3) return "Full name is too short.";
        // Industry standard: letters (including accented), spaces, hyphens, apostrophes only; at least two names
        const fullRe = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;
        if (!fullRe.test(trimmed)) return "Use only letters, spaces, hyphens or apostrophes (at least two names).";
        for (const p of parts) {
            if (p.length < 2) return "Each name must be at least 2 characters.";
            if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'\-]+$/.test(p)) return "Name contains invalid characters.";
        }
        return null;
    }

    function validateEmail(value: string): string | null {
        const trimmed = value.trim();
        if (!trimmed) return "Email is required.";
        if (trimmed.length > 254) return "Email is too long.";
        if (trimmed.includes("..")) return "Email cannot contain consecutive dots.";
        const [local] = trimmed.split("@");
        if (local.length > 64) return "Email local part is too long.";
        // Industry-standard simplified RFC 5322
        const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[A-Za-z]{2,}$/;
        if (!emailRe.test(trimmed)) return "Please enter a valid email address (e.g. name@example.com).";
        return null;
    }

    const [nameTouched, setNameTouched] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);

    const nameError = useMemo(() => validateFullName(contactName), [contactName]);
    const emailError = useMemo(() => validateEmail(contactEmail), [contactEmail]);

    const contactValid = !nameError && !emailError;

    const canContinue = useMemo(() => {
        if (currentStep === 1) return contactValid && Boolean(selectedConsultation);
        if (currentStep === 2) return Boolean(selectedSlot);
        return false;
    }, [currentStep, contactValid, selectedConsultation, selectedSlot]);

    // Prefill from a signed-in patient, if present.
    const initiallyAuthed = useRef(isAuthenticated);
    useEffect(() => {
        if (initiallyAuthed.current && patient) {
            setContactName((n) => n || patient.name || "");
            setContactEmail((e) => e || patient.email || "");
            setContactPhone((p) => p || patient.phone || "");
        }
    }, [patient]);

    // ── Consultation types (Step 1 data) ─────────────────────────────────────
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setConsultationTypesLoading(true);
            setConsultationTypesError("");
            try {
                const response = await fetch("/api/consultation-types");
                const payload = await response.json();
                if (!response.ok) throw new Error(payload?.message || "Unable to load consultation types.");
                const types: ConsultationType[] = Array.isArray(payload?.types) ? payload.types : [];
                if (isMounted) setConsultationTypes(types);
            } catch (error) {
                if (isMounted) {
                    setConsultationTypesError(
                        error instanceof Error ? error.message : "Unable to load consultation types.",
                    );
                    setConsultationTypes([]);
                }
            } finally {
                if (isMounted) setConsultationTypesLoading(false);
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, []);

    // ── Draft: survives the trip to /register and back ───────────────────────
    useEffect(() => {
        if (!selectedConsultation && !selectedSlot) return;
        sessionStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                consultationTypeId: selectedConsultation?.id ?? null,
                date: selectedDate || null,
            }),
        );
    }, [selectedConsultation, selectedDate]);

    const draftApplied = useRef(false);
    useEffect(() => {
        if (draftApplied.current || consultationTypesLoading) return;
        draftApplied.current = true;

        let draft: { consultationTypeId?: string; date?: string } | null = null;
        try {
            const stored = sessionStorage.getItem(DRAFT_KEY);
            if (stored) draft = JSON.parse(stored);
        } catch {
            return;
        }
        if (!draft) return;

        const consultation =
            consultationTypes.find((item) => item.id === draft.consultationTypeId) ?? null;
        if (consultation) setSelectedConsultation(consultation);
        if (draft.date) setSelectedDate(draft.date);
    }, [consultationTypes, consultationTypesLoading]);

    // ── Availability: month calendar (merged across all doctors) ──────────────
    useEffect(() => {
        if (!selectedConsultation) return;

        let isMounted = true;
        const controller = new AbortController();

        const loadMonth = async () => {
            setMonthLoading(true);
            setMonthError("");

            const today = clinicToday(timezone);
            const firstOfMonth = toISODate(monthCursor.year, monthCursor.month, 1);
            const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
            const lastOfMonth = toISODate(monthCursor.year, monthCursor.month, daysInMonth);

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
    }, [selectedConsultation, monthCursor, timezone]);

    // ── Day slots (merged across all doctors) ─────────────────────────────────
    const loadDaySlots = useCallback(async () => {
        if (!selectedConsultation || !selectedDate) return;

        setSlotsLoading(true);
        setSlotsError("");
        setDaySlots([]);
        setDayReason(null);
        setSelectedSlot(null);

        try {
            const query = new URLSearchParams({
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
    }, [selectedConsultation, selectedDate]);

    useEffect(() => {
        if (!selectedDate) {
            setDaySlots([]);
            setDayReason(null);
            return;
        }
        loadDaySlots();
    }, [selectedDate, loadDaySlots]);

    // ── Medical note upload ───────────────────────────────────────────────────
    const handleNoteFile = async (file?: File | null) => {
        if (!file) return;
        setNoteUploadError("");
        setNoteUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/media/medical-note", { method: "POST", body: formData });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message || "Unable to upload the medical note.");
            setMedicalNoteUrl(payload.url);
            setMedicalNoteName(file.name);
        } catch (error) {
            setNoteUploadError(error instanceof Error ? error.message : "Unable to upload the medical note.");
            setMedicalNoteUrl("");
            setMedicalNoteName("");
        } finally {
            setNoteUploading(false);
        }
    };

    // ── Selection cascade: change upstream invalidates downstream ─────────────
    const chooseConsultation = (consultation: ConsultationType) => {
        setSelectedConsultation(consultation);
        setSelectedDate("");
        setSelectedSlot(null);
        setSlotTakenNotice("");
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

    const moveNext = () => {
        if (currentStep === 1 && !contactValid) {
            setNameTouched(true);
            setEmailTouched(true);
            return;
        }
        if (!canContinue || currentStep >= 3) return;
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
        if (!selectedConsultation || !selectedSlot || isSubmitting) return;
        if (!contactValid) {
            setNameTouched(true);
            setEmailTouched(true);
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");
        setPaymentError("");

        try {
            let appointmentId: string;

            if (booked) {
                // Retry: appointment already created, just re-initiate payment.
                appointmentId = booked.id;
            } else {
                const response = await fetch("/api/appointments", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        "x-idempotency-key": bookingKey(),
                    },
                    body: JSON.stringify({
                        consultationTypeId: selectedConsultation.id,
                        startAt: selectedSlot.startAt,
                        contactName: contactName.trim(),
                        contactEmail: contactEmail.trim(),
                        contactPhone: contactPhone.trim() || undefined,
                        notes: notes.trim() || undefined,
                        ...(medicalNoteUrl ? { medicalNoteUrl } : {}),
                    }),
                });

                const payload = await response.json();

                if (response.status === 409) {
                    idempotencyKeyRef.current = null;
                    setSelectedSlot(null);
                    setSlotTakenNotice("That time was just taken. Here are the times still open.");
                    setCurrentStep(2);
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

            // Initiate payment and redirect to the payment page.
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

            // Payment initiation failed.
            setPaymentError(payData?.message || "Unable to start payment. Please try again.");
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
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
                <p className="text-xl font-semibold uppercase tracking-normal text-indigo-700">Book Appointment</p>
                <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                    Tell us who you are and what you need, then pick an open time. A team member will confirm your
                    doctor before your visit.
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
                                            if (step.id <= currentStep) setCurrentStep(step.id);
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
                    <div className="rounded-3xl">
                        <div className="mt-6 px-5 sm:px-6">
                            {/* ── Step 1: details + consultation type + note ─────────── */}
                            {currentStep === 1 && (
                                <div className="space-y-5">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Your details</p>
                                            {!isAuthenticated && (
                                                <Link
                                                    href="/login?redirect=/appointment"
                                                    className="text-xs font-semibold text-indigo-700 hover:underline"
                                                >
                                                    Have an account? Sign in
                                                </Link>
                                            )}
                                        </div>

                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <label className="grid gap-1 text-sm sm:col-span-2">
                                                <span className="font-semibold text-slate-700">Full name <span className="text-red-500">*</span></span>
                                                <input
                                                    value={contactName}
                                                    onChange={(event) => setContactName(event.target.value)}
                                                    onBlur={() => setNameTouched(true)}
                                                    required
                                                    autoComplete="name"
                                                    aria-invalid={nameTouched && !!nameError}
                                                    className={`h-11 rounded-xl border bg-white px-3 outline-none focus:ring ${nameTouched && nameError ? "border-red-300 focus:ring-red-200" : "border-slate-300 ring-indigo-300 focus:ring"}`}
                                                    placeholder="Ada Obi"
                                                />
                                                {nameTouched && nameError && <span className="text-xs font-medium text-red-600">{nameError}</span>}
                                            </label>
                                            <label className="grid gap-1 text-sm">
                                                <span className="font-semibold text-slate-700">Email <span className="text-red-500">*</span></span>
                                                <input
                                                    value={contactEmail}
                                                    onChange={(event) => setContactEmail(event.target.value)}
                                                    onBlur={() => setEmailTouched(true)}
                                                    type="email"
                                                    required
                                                    autoComplete="email"
                                                    inputMode="email"
                                                    aria-invalid={emailTouched && !!emailError}
                                                    className={`h-11 rounded-xl border bg-white px-3 outline-none focus:ring ${emailTouched && emailError ? "border-red-300 focus:ring-red-200" : "border-slate-300 ring-indigo-300 focus:ring"}`}
                                                    placeholder="name@email.com"
                                                />
                                                {emailTouched && emailError && <span className="text-xs font-medium text-red-600">{emailError}</span>}
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

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Appointment type</p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Choose how you&apos;d like to meet your care team.
                                        </p>

                                        {consultationTypesLoading && (
                                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                                Loading appointment types...
                                            </div>
                                        )}
                                        {consultationTypesError && (
                                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                {consultationTypesError}
                                            </div>
                                        )}

                                        {!consultationTypesLoading && !consultationTypesError && (
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                {consultationTypes.map((consultation) => {
                                                    const selected = selectedConsultation?.id === consultation.id;
                                                    return (
                                                        <button
                                                            key={consultation.id}
                                                            type="button"
                                                            onClick={() => chooseConsultation(consultation)}
                                                            className={`rounded-2xl border p-4 text-left transition ${selected
                                                                ? "border-indigo-300 bg-indigo-50/60 shadow-md shadow-indigo-100"
                                                                : "border-slate-200 bg-white hover:border-indigo-200"
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <p className="text-base font-semibold text-slate-900">
                                                                    {consultation.name}
                                                                </p>
                                                                {consultation.isVideo && (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                                        <Video className="h-3 w-3" /> Video
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
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                            Medical note (optional)
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Attach a referral letter or scan report (PDF or image) so the team can prepare.
                                        </p>

                                        {!medicalNoteUrl ? (
                                            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40">
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/*"
                                                    className="hidden"
                                                    onChange={(event) => handleNoteFile(event.target.files?.[0])}
                                                />
                                                <Paperclip className="h-6 w-6 text-slate-400" />
                                                <p className="mt-2 text-sm font-semibold text-slate-700">
                                                    {noteUploading ? "Uploading..." : "Click to attach a file"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">PDF or image, up to a few MB</p>
                                            </label>
                                        ) : (
                                            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-indigo-600" />
                                                    <span className="truncate text-sm font-medium text-indigo-800">
                                                        {medicalNoteName || "Medical note attached"}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMedicalNoteUrl("");
                                                        setMedicalNoteName("");
                                                    }}
                                                    className="text-slate-400 transition hover:text-slate-600"
                                                    aria-label="Remove medical note"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {noteUploadError && (
                                            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                                {noteUploadError}
                                            </div>
                                        )}
                                    </div>

                                    <label className="grid gap-1 text-sm">
                                        <span className="font-semibold text-slate-700">Clinical notes (optional)</span>
                                        <textarea
                                            value={notes}
                                            onChange={(event) => setNotes(event.target.value)}
                                            maxLength={2000}
                                            className="min-h-24 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-indigo-300 focus:ring"
                                            placeholder="Add symptoms or current concerns"
                                        />
                                    </label>
                                </div>
                            )}

                            {/* ── Step 2: schedule ──────────────────────────────────── */}
                            {currentStep === 2 && (
                                <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
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
                                                const isOpen = Boolean(day && day.slots.length > 0);
                                                const isSelected = selectedDate === cell.date;
                                                return (
                                                    <button
                                                        key={cell.date}
                                                        type="button"
                                                        onClick={() => chooseDate(cell.date)}
                                                        disabled={!isOpen}
                                                        title={isOpen ? `${day!.slots.length} open` : reasonMessage(day?.reason ?? null)}
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
                                                    <p className="text-sm font-semibold text-slate-900">{formatISODateLong(selectedDate)}</p>
                                                    {timezone && <p className="text-xs text-slate-500">Times shown in clinic time ({timezone})</p>}
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
                                                        {reasonMessage(dayReason)}
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
                                                                    <span className="block text-sm font-semibold">
                                                                        {slot.startTime} – {slot.endTime}
                                                                    </span>
                                                                    <span className={`mt-0.5 block text-[11px] ${selected ? "text-indigo-200" : "text-slate-400"}`}>
                                                                        {slot.durationMinutes} min
                                                                    </span>
                                                                    {selected && <Check className="absolute right-2 top-2 h-4 w-4 text-white" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {selectedSlot && (
                                                    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                                                        <span className="font-semibold">Selected:</span> {formatISODateLong(selectedDate)},{" "}
                                                        {selectedSlot.startTime} – {selectedSlot.endTime}
                                                        <span className="ml-2 text-xs text-indigo-500">({selectedSlot.durationMinutes} min)</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: confirm + payment ─────────────────────────── */}
                            {currentStep === 3 && (
                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Appointment type</p>
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
                                    {(notes || medicalNoteUrl) && (
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attachments</p>
                                            {medicalNoteUrl && (
                                                <p className="mt-1 text-sm text-slate-800">📎 {medicalNoteName || "Medical note"}</p>
                                            )}
                                            {notes && <p className="mt-1 text-xs leading-5 text-slate-600">{notes}</p>}
                                        </div>
                                    )}

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
                                    {paymentError && (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {paymentError}
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
                                                {isSubmitting ? "Processing..." : "Confirm & Proceed to Payment"}
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
                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reference</p>
                                                <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
                                                    {booked.referenceNumber}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!booked && currentStep < 3 && (
                            <div className="mt-6 sticky bottom-0 px-5 pb-5 pt-4 -mb-5 bg-white/40 backdrop-blur-2xl z-10 border-t border-slate-100">
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
                                        disabled={Boolean(booked) || currentStep >= 3}
                                        className={`rounded-full bg-[#1a1aaa] px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${!canContinue ? "opacity-40" : ""}`}
                                        aria-disabled={!canContinue}
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

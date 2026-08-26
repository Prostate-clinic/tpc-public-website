"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

function PaymentStatusInner() {
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference");
    const code = searchParams.get("code");

    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

    useEffect(() => {
        if (!reference) {
            setStatus("failed");
            return;
        }

        if (code && code !== "00") {
            setStatus("failed");
            return;
        }

        let attempts = 0;
        const maxAttempts = 10;

        const verify = async () => {
            try {
                const res = await fetch(`/api/payments/verify/${encodeURIComponent(reference)}`);
                const data = await res.json();

                if (data.verified && data.status === 2) {
                    setStatus("success");
                    return;
                }

                if (data.status >= 400) {
                    setStatus("failed");
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(verify, 3000);
                } else {
                    setStatus("failed");
                }
            } catch {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(verify, 3000);
                } else {
                    setStatus("failed");
                }
            }
        };

        verify();
    }, [reference, code]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70 text-center">
                {status === "loading" && (
                    <>
                        <Loader2 className="mx-auto h-14 w-14 animate-spin text-indigo-600" />
                        <h1 className="mt-6 text-2xl font-bold text-slate-900">Confirming your payment...</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Please wait while we verify your transaction.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle className="mx-auto h-14 w-14 text-emerald-600" />
                        <h1 className="mt-6 text-2xl font-bold text-slate-900">Payment Confirmed!</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Your appointment has been confirmed. You will receive a confirmation email shortly.
                        </p>
                        <div className="mt-8 flex flex-col gap-3">
                            <Link
                                href="/patient-portal?section=history"
                                className="rounded-full bg-[#1a1aaa] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#111188]"
                            >
                                View My Appointments
                            </Link>
                            <Link
                                href="/"
                                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </>
                )}

                {status === "failed" && (
                    <>
                        <XCircle className="mx-auto h-14 w-14 text-red-600" />
                        <h1 className="mt-6 text-2xl font-bold text-slate-900">Payment Not Completed</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Your payment was not completed. If you were charged, please contact support.
                        </p>
                        <div className="mt-8 flex flex-col gap-3">
                            <Link
                                href="/appointment"
                                className="rounded-full bg-[#1a1aaa] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#111188]"
                            >
                                Try Again
                            </Link>
                            <Link
                                href="/"
                                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export function PaymentStatus() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            }
        >
            <PaymentStatusInner />
        </Suspense>
    );
}

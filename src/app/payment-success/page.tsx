"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, XCircle, Loader2, X } from "lucide-react";

function PaymentPopupContent() {
    const searchParams = useSearchParams();
    const txRef = searchParams.get("reference") || searchParams.get("tx_ref");
    const code = searchParams.get("code");
    const status = searchParams.get("status");

    const [verificationState, setVerificationState] = useState<"loading" | "success" | "failed" | "pending">("loading");
    const [paymentDetails, setPaymentDetails] = useState<{ amount?: number; reference?: string } | null>(null);

    useEffect(() => {
        if (status === "cancelled" || (code && code !== "00")) {
            setVerificationState("failed");
            return;
        }

        if (!txRef) {
            setVerificationState("failed");
            return;
        }

        let attempts = 0;
        const maxAttempts = 10;

        const pollVerification = async () => {
            try {
                const res = await fetch(`/api/payments/verify/${encodeURIComponent(txRef)}`);
                const data = await res.json();

                if (data.verified && data.status === 2) {
                    setVerificationState("success");
                    setPaymentDetails({ amount: data.paid_amount, reference: data.provider_reference });
                    return;
                }

                if (data.status >= 400) {
                    setVerificationState("failed");
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(pollVerification, 3000);
                } else {
                    setVerificationState("pending");
                }
            } catch {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(pollVerification, 3000);
                } else {
                    setVerificationState("pending");
                }
            }
        };

        pollVerification();
    }, [txRef, status]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                <Link
                    href="/"
                    className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-5 w-5" />
                </Link>

                {verificationState === "loading" && (
                    <div className="space-y-4 text-center">
                        <Loader2 className="mx-auto h-14 w-14 animate-spin text-indigo-600" />
                        <h1 className="text-2xl font-bold text-slate-900">Confirming your payment...</h1>
                        <p className="text-sm text-slate-600">Please wait while we verify your transaction.</p>
                    </div>
                )}

                {verificationState === "success" && (
                    <div className="space-y-4 text-center">
                        <CheckCircle className="mx-auto h-14 w-14 text-emerald-600" />
                        <h1 className="text-2xl font-bold text-slate-900">Payment Confirmed!</h1>
                        <p className="text-sm text-slate-600">
                            Your appointment has been confirmed. You will receive a confirmation email shortly.
                        </p>
                        {paymentDetails?.amount != null && (
                            <p className="text-xs text-slate-500">
                                Amount paid: NGN {paymentDetails.amount.toLocaleString("en-NG")}
                            </p>
                        )}
                        <div className="flex flex-col gap-2 pt-2">
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

                {verificationState === "pending" && (
                    <div className="space-y-4 text-center">
                        <Loader2 className="mx-auto h-14 w-14 animate-spin text-amber-500" />
                        <h1 className="text-2xl font-bold text-slate-900">Payment Processing</h1>
                        <p className="text-sm text-slate-600">
                            Your payment is still being processed. You will receive a confirmation email once complete.
                        </p>
                        <Link
                            href="/patient-portal?section=history"
                            className="inline-block rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                        >
                            View My Appointments
                        </Link>
                    </div>
                )}

                {verificationState === "failed" && (
                    <div className="space-y-4 text-center">
                        <XCircle className="mx-auto h-14 w-14 text-red-600" />
                        <h1 className="text-2xl font-bold text-slate-900">Payment Not Completed</h1>
                        <p className="text-sm text-slate-600">
                            Your payment was not completed. If you were charged, please contact support.
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Link
                                href="/appointment"
                                className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                            >
                                Try Again
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
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
            }
        >
            <PaymentPopupContent />
        </Suspense>
    );
}

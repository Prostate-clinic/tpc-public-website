"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Loader2, X } from "lucide-react";

export function PaymentVerificationPopup() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const txRef = searchParams.get("tx_ref");

    const [state, setState] = useState<"verifying" | "success" | "failed" | "pending">("verifying");
    const [amount, setAmount] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const cleanUrl = useCallback(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("tx_ref");
        url.searchParams.delete("status");
        window.history.replaceState({}, "", url.toString());
    }, []);

    useEffect(() => {
        if (!txRef || dismissed) return;

        let attempts = 0;
        const maxAttempts = 10;

        const verify = async () => {
            try {
                const res = await fetch(`/api/payments/verify/${encodeURIComponent(txRef)}`);
                const data = await res.json();

                if (data.verified && data.status === 200) {
                    setState("success");
                    setAmount(data.paid_amount ?? null);
                    cleanUrl();
                    return;
                }

                if (data.status >= 400) {
                    setState("failed");
                    cleanUrl();
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(verify, 3000);
                } else {
                    setState("pending");
                    cleanUrl();
                }
            } catch {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(verify, 3000);
                } else {
                    setState("pending");
                    cleanUrl();
                }
            }
        };

        verify();
    }, [txRef, dismissed, cleanUrl]);

    if (!txRef || dismissed) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-5 w-5" />
                </button>

                {state === "verifying" && (
                    <div className="space-y-4 text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">Confirming payment...</h2>
                        <p className="text-sm text-slate-600">Please wait while we verify your transaction.</p>
                    </div>
                )}

                {state === "success" && (
                    <div className="space-y-4 text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
                        <h2 className="text-xl font-bold text-slate-900">Payment Confirmed!</h2>
                        <p className="text-sm text-slate-600">
                            Your appointment is confirmed. A confirmation email will be sent shortly.
                        </p>
                        {amount != null && (
                            <p className="text-xs text-slate-500">
                                Amount paid: NGN {amount.toLocaleString("en-NG")}
                            </p>
                        )}
                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setDismissed(true);
                                    router.push("/patient-portal?section=history");
                                }}
                                className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                            >
                                View My Appointments
                            </button>
                            <button
                                onClick={() => setDismissed(true)}
                                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Continue Browsing
                            </button>
                        </div>
                    </div>
                )}

                {state === "pending" && (
                    <div className="space-y-4 text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-amber-500" />
                        <h2 className="text-xl font-bold text-slate-900">Payment Processing</h2>
                        <p className="text-sm text-slate-600">
                            Your payment is still processing. You will receive a confirmation email once complete.
                        </p>
                        <button
                            onClick={() => setDismissed(true)}
                            className="inline-block rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {state === "failed" && (
                    <div className="space-y-4 text-center">
                        <XCircle className="mx-auto h-12 w-12 text-red-600" />
                        <h2 className="text-xl font-bold text-slate-900">Payment Not Completed</h2>
                        <p className="text-sm text-slate-600">
                            Your payment was not completed. If you were charged, please contact support.
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setDismissed(true);
                                    router.push("/appointment");
                                }}
                                className="rounded-full bg-[#1a1aaa] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111188]"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => setDismissed(true)}
                                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

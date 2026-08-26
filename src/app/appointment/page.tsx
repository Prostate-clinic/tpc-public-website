"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { AppointmentFlow } from "@/components/AppointmentFlow";
import { PaymentStatus } from "@/components/PaymentStatus";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Loader2 } from "lucide-react";

function AppointmentContent() {
    const searchParams = useSearchParams();
    const hasPaymentParams = searchParams.has("reference") || searchParams.has("code");

    return hasPaymentParams ? <PaymentStatus /> : <AppointmentFlow />;
}

export default function AppointmentPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header />
            <main className="pb-16 pt-8 sm:pt-10 lg:pt-14">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    }
                >
                    <AppointmentContent />
                </Suspense>
            </main>
            <GlobalFooter />
        </div>
    );
}

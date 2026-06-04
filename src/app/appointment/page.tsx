import { Header } from "@/components/Header";
import { AppointmentFlow } from "@/components/AppointmentFlow";
import { GlobalFooter } from "@/components/GlobalFooter";

export default function AppointmentPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="pb-16 pt-8 sm:pt-10 lg:pt-14">
        <AppointmentFlow />
      </main>
      <GlobalFooter />
    </div>
  );
}

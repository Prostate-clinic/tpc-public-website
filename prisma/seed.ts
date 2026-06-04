import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding services...");

  const serviceData = [
    { name: "Robotic Radical Prostatectomy", category: "SURGICAL" as const, duration: 105, price: 1250000, description: "AI-assisted surgical mapping with precision robotic execution.", focus: ["Nerve-sparing precision", "Low blood-loss protocol", "Enhanced recovery pathway"] },
    { name: "Robotic Partial Nephrectomy", category: "SURGICAL" as const, duration: 120, price: 1450000, description: "Kidney-preserving surgery with image-guided margin planning.", focus: ["Tumor margin mapping", "Renal function protection", "Short-stay recovery"] },
    { name: "Comprehensive Urology Consultation", category: "CONSULTATION" as const, duration: 45, price: 80000, description: "Expert consult with diagnostics review and tailored care plan.", focus: ["Risk profile review", "Specialist treatment roadmap", "Lifestyle and follow-up plan"] },
    { name: "AI-Assisted Clinical Consultation", category: "CONSULTATION" as const, duration: 40, price: 95000, description: "Clinical decision support blended with consultant judgment.", focus: ["Predictive care insights", "Second-opinion confidence", "Faster decision cycle"] },
    { name: "Advanced Prostate Imaging", category: "DIAGNOSTICS" as const, duration: 35, price: 110000, description: "High-resolution imaging for treatment planning.", focus: ["Multi-parametric protocol", "Targeted lesion reporting", "Pre-op surgical mapping"] },
    { name: "Urology Lab and Marker Diagnostics", category: "DIAGNOSTICS" as const, duration: 25, price: 65000, description: "Biomarker and pathology support for early detection.", focus: ["PSA and marker panels", "Structured lab interpretation", "Progress monitoring baselines"] },
    { name: "Precision MRI Imaging Pathway", category: "IMAGING" as const, duration: 50, price: 180000, description: "High-resolution MRI protocols for definitive imaging clarity.", focus: ["High-contrast imaging", "Surgical planning support", "Radiology specialist review"] },
  ];

  for (const svc of serviceData) {
    const id = svc.name.toLowerCase().replace(/\s+/g, "-");
    const exists = await prisma.service.findUnique({ where: { id } });
    if (!exists) {
      await prisma.service.create({ data: { id, ...svc } });
      console.log(`  Created: ${svc.name}`);
    } else {
      console.log(`  Exists: ${svc.name}`);
    }
  }

  console.log("");

  const doctorData = [
    { id: "adeyemi", name: "Dr. Temitope Adeyemi", specialty: "Robotic Urology Surgeon", bio: "Expert in robotic prostate procedures with a strong focus on precision-led recovery pathways." },
    { id: "okonkwo", name: "Dr. Chika Okonkwo", specialty: "Consultant Urologist", bio: "Specializes in comprehensive diagnosis, patient counseling, and long-term urologic care plans." },
    { id: "balogun", name: "Dr. Farouk Balogun", specialty: "Imaging and Diagnostic Specialist", bio: "Leads advanced diagnostic imaging and evidence-based treatment pathway planning." },
    { id: "olonade", name: "Dr. Tosin Olonade", specialty: "Urologic Oncology Specialist", bio: "Focuses on early-detection oncology and multidisciplinary treatment coordination." },
  ];

  for (const doc of doctorData) {
    const exists = await prisma.doctor.findUnique({ where: { id: doc.id } });
    if (!exists) {
      await prisma.doctor.create({ data: doc });
      console.log(`  Created: ${doc.name}`);
    } else {
      console.log(`  Exists: ${doc.name}`);
    }
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

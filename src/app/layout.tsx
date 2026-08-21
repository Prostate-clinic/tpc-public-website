import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopLoader } from "next-top-loader";
import { PatientAuthProvider } from "@/contexts/PatientAuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://imoroboticscenter.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Imo Robotics and Oncology Center | Robotic Urology & AI-Assisted Care",
    template: "%s | Imo Robotics and Oncology Center",
  },
  description:
    "Advanced robotic urology, minimally invasive surgery, diagnostics, and specialist-led treatment pathways at Imo Robotics and Oncology Center.",
  keywords: [
    "robotic urology",
    "urology clinic",
    "prostate treatment",
    "kidney stone treatment",
    "AI-assisted care",
    "minimally invasive surgery",
    "urologist",
    "healthcare diagnostics",
    "Imo Robotics and Oncology Center",
  ],
  alternates: {
    canonical: "/",
  },
  category: "healthcare",
  applicationName: "Imo Robotics and Oncology Center",
  authors: [{ name: "Imo Robotics and Oncology Center" }],
  creator: "Imo Robotics and Oncology Center",
  publisher: "Imo Robotics and Oncology Center",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Imo Robotics and Oncology Center",
    title: "Imo Robotics and Oncology Center | Robotic Urology & AI-Assisted Care",
    description:
      "Book appointments with specialist urologists and access robotic, precision-led treatment options.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Imo Robotics and Oncology Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Imo Robotics and Oncology Center | Robotic Urology & AI-Assisted Care",
    description:
      "Specialist robotic urology services, modern diagnostics, and patient-first treatment pathways.",
    images: ["/logo.png"],
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <TopLoader color="#0900a9" initialProgress={20} height={2}/>
        <PatientAuthProvider>
          {children}
        </PatientAuthProvider>
      </body>
    </html>
  );
}

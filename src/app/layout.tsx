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

export const metadata: Metadata = {
  title: "IMO Robotics Center",
  description: "Center for Robotic Urology & AI-Assisted Care",
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
      <body className="min-h-full flex flex-col">
        <TopLoader color="#0900a9" initialProgress={20} height={2}/>
        <PatientAuthProvider>
          {children}
        </PatientAuthProvider>
      </body>
    </html>
  );
}

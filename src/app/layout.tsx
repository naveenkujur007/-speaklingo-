import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/teacher/pwa-install-prompt";
import { ServiceWorkerRegister } from "@/components/teacher/sw-register";
import { AudioUnlock } from "@/components/teacher/audio-unlock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpeakLingo - AI Spoken Language Teacher",
  description:
    "Talk with an AI language teacher that catches your mistakes and helps you improve. Voice in, voice out, real-time corrections. Structured A1-C2 curriculum, spaced repetition, pronunciation scoring, role-play scenarios.",
  keywords: [
    "language learning",
    "english speaking",
    "AI teacher",
    "spoken english",
    "conversation practice",
    "pronunciation",
    "PWA",
    "installable",
  ],
  authors: [{ name: "SpeakLingo" }],
  // PWA manifest + icons
  manifest: "/manifest.json",
  applicationName: "SpeakLingo",
  appleWebApp: {
    capable: true,
    title: "SpeakLingo",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32.png"],
  },
  openGraph: {
    title: "SpeakLingo - AI Spoken Language Teacher",
    description:
      "Talk with an AI teacher that catches your mistakes and helps you improve. Installable PWA - add to home screen on laptop & mobile.",
    url: "https://chat.z.ai",
    siteName: "SpeakLingo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpeakLingo - AI Spoken Language Teacher",
    description:
      "Talk with an AI teacher that catches your mistakes and helps you improve.",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <PWAInstallPrompt />
        <ServiceWorkerRegister />
        <AudioUnlock />
      </body>
    </html>
  );
}

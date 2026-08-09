import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinguaBot - AI Spoken Language Teacher",
  description:
    "Talk with an AI language teacher that catches your mistakes and helps you improve. Voice in, voice out, real-time corrections. Multi-language ready, English-focused.",
  keywords: [
    "language learning",
    "english speaking",
    "AI teacher",
    "spoken english",
    "conversation practice",
    "pronunciation",
  ],
  authors: [{ name: "LinguaBot" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "LinguaBot - AI Spoken Language Teacher",
    description:
      "Talk with an AI teacher that catches your mistakes and helps you improve.",
    url: "https://chat.z.ai",
    siteName: "LinguaBot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinguaBot - AI Spoken Language Teacher",
    description:
      "Talk with an AI teacher that catches your mistakes and helps you improve.",
  },
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
      </body>
    </html>
  );
}

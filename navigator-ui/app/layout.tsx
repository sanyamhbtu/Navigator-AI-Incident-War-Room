import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Navigator — AI Incident War Room",
  description:
    "One Coral SQL query across PagerDuty, GitHub, Datadog, Sentry, Slack, and Linear. Llama 3.3 70B on Groq reads the result. Your on-call gets a brief in under fifteen seconds.",
  metadataBase: new URL("https://navigator-ui.vercel.app"),
  openGraph: {
    title: "Navigator — AI Incident War Room",
    description:
      "From alert to root cause in 12 seconds. Six tools, one SQL query.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}

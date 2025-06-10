import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FirebaseProvider } from "@/lib/firebase";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { LoggerProvider } from "@/lib/logging/LoggerProvider";
import { ErrorBoundary } from "@/components/error-boundary";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { config } from "@/lib/config/environment";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: {
    default: "NovaTrek - AI-Powered Travel Planning",
    template: "%s | NovaTrek"
  },
  description: "Plan your perfect trip with AI-powered recommendations, expert advice, and collaborative planning tools. Create personalized itineraries for any destination.",
  keywords: [
    "travel planning",
    "AI travel planner",
    "trip planning",
    "vacation planner",
    "travel itinerary",
    "travel recommendations",
    "travel experts",
    "group travel planning",
    "personalized travel"
  ],
  authors: [{ name: "NovaTrek" }],
  creator: "NovaTrek",
  publisher: "NovaTrek",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: config.appUrl,
    siteName: "NovaTrek",
    title: "NovaTrek - AI-Powered Travel Planning",
    description: "Plan your perfect trip with AI-powered recommendations, expert advice, and collaborative planning tools.",
    images: [
      {
        url: "/api/og?theme=bw",
        width: 1200,
        height: 630,
        alt: "NovaTrek - AI-Powered Travel Planning"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@novatrek",
    creator: "@novatrek",
    title: "NovaTrek - AI-Powered Travel Planning",
    description: "Plan your perfect trip with AI-powered recommendations, expert advice, and collaborative planning tools.",
    images: ["/api/og?theme=bw"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseProvider>
            <LoggerProvider>
              <ErrorBoundary>
                {children}
                <SpeedInsights />
              </ErrorBoundary>
            </LoggerProvider>
          </FirebaseProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

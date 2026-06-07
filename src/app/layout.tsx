import type { Metadata } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AppTrack",
  description: "Track job applications using advanced analytics to optimize your job search.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "AppTrack",
    description: "Track job applications using advanced analytics to optimize your job search.",
    siteName: "AppTrack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppTrack",
    description: "Track job applications using advanced analytics to optimize your job search.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AppTrack",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${hanken.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fbfaf8" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1c1e2d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AppTrack" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script src="/sw-register.js" defer nonce={nonce} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <ThemeProvider nonce={nonce}>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

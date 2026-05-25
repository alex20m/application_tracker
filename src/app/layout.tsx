import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f4f6f9" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AppTrack" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script src="/sw-register.js" defer nonce={nonce} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider nonce={nonce}>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KAMAL vs COCKROACH — Live Pixel War",
  description: "Choose a side. Buy pixels. Reveal the future.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "KAMAL vs COCKROACH — Live Pixel War",
    description: "Choose a side. Buy pixels. Reveal the future.",
    url: SITE_URL,
    siteName: SITE_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

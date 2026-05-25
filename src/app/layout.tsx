import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
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
  title: "KAMAL vs COCKROACH — Live Pixel Canvas",
  description: "Buy a pixel. Be part of history. Reveal the image one square at a time.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "KAMAL vs COCKROACH — Live Pixel Canvas",
    description: "Buy a pixel. Be part of history. Reveal the image one square at a time.",
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
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";

import "./globals.css";
import { HeadThemeScript } from "./head-theme-script";

import { Toaster } from "@/components/toast/toaster";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Casella",
  description: "Medewerkerportaal Ascentra",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nl"
      className={`${GeistSans.variable} ${GeistMono.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        <HeadThemeScript />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

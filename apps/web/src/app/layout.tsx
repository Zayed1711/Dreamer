import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Titles: squared, technical. Numbers: monospace. Body: plain and readable.
const title = Chakra_Petch({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-title" });
const mono = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-mono" });
const body = IBM_Plex_Sans({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Dreamer",
  description: "Your study-abroad journey, from E-Rank to S-Rank Dreamer.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05080f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${title.variable} ${mono.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

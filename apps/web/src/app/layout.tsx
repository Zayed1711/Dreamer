import type { Metadata, Viewport } from "next";
import { Anton, Chakra_Petch, Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Tracker (System theme). Titles: squared, technical. Numbers: monospace. Body: plain and readable.
const title = Chakra_Petch({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-title" });
const mono = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-mono" });
const body = IBM_Plex_Sans({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-body" });
// Public website (editorial). Serif headlines with italic accents, condensed display for the name ticker.
const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif" });
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "WayPoint — Study Abroad Flight Tracker",
  description: "No dream is too big and no dreamer is too small. Your step-by-step study-abroad flight tracker from Bangladesh to the world.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WayPoint",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05080f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${title.variable} ${mono.variable} ${body.variable} ${serif.variable} ${display.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

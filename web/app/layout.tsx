import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Conatus — on-chain AI audit agent for Mantle",
  description:
    "Autonomous AI smart-contract auditor: Slither + Mantle gas heuristics + LLM synthesis, every verdict anchored on-chain under an ERC-8004 identity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-forensic">{children}</body>
    </html>
  );
}

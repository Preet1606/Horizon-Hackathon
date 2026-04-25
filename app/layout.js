import { Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
});

export const metadata = {
  title: "CIPHER HUE — Mastermind Colour Deduction",
  description: "A cyberpunk Mastermind colour-deduction puzzle game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${shareTechMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

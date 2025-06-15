import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";

// This will add the font to a CSS variable
const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JustPrep",
  description: "AI powered platform for preparing mock interviews.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${monaSans.variable}`}>
      <body 
      className="antialiased pattern font-sans">
      {children}
      </body>
    </html>
  );
}

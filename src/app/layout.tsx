import type { Metadata } from "next";
import { Delius_Swash_Caps, JetBrains_Mono } from "next/font/google";
import ThemeRegistry from "./theme-provider";
import "./globals.css";

const delius = Delius_Swash_Caps({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-delius",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Replacle - 2 Player Word Replacement Game",
  description: "The 2-player word replacement game. Change one letter, make a valid word, don't repeat.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Replacle",
    description: "The 2-player word replacement game. Change one letter, make a valid word, don't repeat.",
    images: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${delius.variable} ${jetbrains.variable}`}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import ThemeRegistry from "./theme-provider";
import "./globals.css";

const montserrat = Montserrat({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
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
    <html lang="en" className={montserrat.variable}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
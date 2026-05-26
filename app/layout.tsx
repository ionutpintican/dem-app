import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import FundalDecorativ from "@/components/layout/FundalDecorativ";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Decizia Oncologică",
  description: "Platformă pentru deciziile echipei medicale multidisciplinare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FundalDecorativ />
        {children}
      </body>
    </html>
  );
}

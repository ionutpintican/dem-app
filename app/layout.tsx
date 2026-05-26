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
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://ctm.iocn.ro" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-rose-600 focus:rounded-lg focus:shadow-lg focus:font-medium"
        >
          Sari la conținut principal
        </a>
        <FundalDecorativ />
        {children}
      </body>
    </html>
  );
}

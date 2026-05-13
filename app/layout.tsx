import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Syal Operations Group — Intelligent Payroll on Autopilot",
  description:
    "Streamline your entire payroll lifecycle from hours-to-paycheck, eliminating spreadsheets and human error.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

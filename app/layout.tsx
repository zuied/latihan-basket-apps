import type { Metadata } from "next";
import { DM_Sans, Arimo } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aplikasi Latihan Basket",
    template: "%s | Aplikasi Latihan Basket",
  },
  description: "Manajemen program latihan basket, tracking atlet, dan rapor perkembangan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${dmSans.variable} ${arimo.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
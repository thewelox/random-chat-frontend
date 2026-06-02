import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VIBE - Meet. Chat. Connect.",
  description: "Premium social media and realtime communication platform by WELOX & CO",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} min-h-screen bg-[#08060F] text-white antialiased`}>{children}</body>
    </html>
  );
}

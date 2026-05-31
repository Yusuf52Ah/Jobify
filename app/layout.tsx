import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Jobify.uz — O‘zbekistonda ishonchli ish portali",
  description:
    "O‘zbekistonga mo‘ljallangan iliq editorial ish portali: tanlab olingan e'lonlar, ishonchli ish beruvchilar va professionallar uchun dizayn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

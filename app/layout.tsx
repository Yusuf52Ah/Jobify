import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jobify.uz"),
  title: {
    default: "Jobify",
    template: "%s | Jobify",
  },
  description:
    "O'zbekistondagi ish izlovchilar va ish beruvchilar uchun sodda, ishonchli va professional ish platformasi.",
  applicationName: "Jobify",
  keywords: ["Jobify", "ish topish", "vakansiya", "ish beruvchi", "O'zbekiston"],
  authors: [{ name: "Jobify" }],
  creator: "Jobify",
  publisher: "Jobify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Jobify",
    description:
      "O'zbekiston uchun qulay va ishonchli ish e'lonlari platformasi.",
    url: "/",
    siteName: "Jobify",
    type: "website",
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobify",
    description:
      "O'zbekiston uchun qulay va ishonchli ish e'lonlari platformasi.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

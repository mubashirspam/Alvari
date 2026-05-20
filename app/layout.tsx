import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/env";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/seo/jsonld";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Alvari — Direct-from-Factory Furniture, Wayanad",
    template: "%s · Alvari",
  },
  description:
    "Almirahs, beds, sofas and complete room sets handcrafted in our Wayanad factory. Factory prices, no middlemen. Delivered across Kerala.",
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  keywords: [
    "furniture Kerala",
    "furniture Wayanad",
    "teak furniture Kerala",
    "factory furniture Kerala",
    "almirah Kerala",
    "sofa set Kerala",
    "dining table Kerala",
    "Alvari",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_IN",
    url: siteConfig.url,
    title: "Alvari — Direct-from-Factory Furniture, Wayanad",
    description:
      "Factory-priced wardrobes, beds, sofas, and complete room sets. Built in Wayanad, delivered across Kerala.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alvari — Direct-from-Factory Furniture",
    description:
      "Factory-priced wardrobes, beds, sofas, and complete room sets. Built in Wayanad, delivered across Kerala.",
    images: ["/og-default.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body>
        <JsonLd data={[organizationJsonLd(), localBusinessJsonLd()]} />
        {children}
      </body>
    </html>
  );
}

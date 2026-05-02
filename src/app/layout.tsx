import type { Metadata, Viewport } from "next";
import { fontDisplay, fontSans } from "@/lib/fonts";
import { site } from "@/config/site";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/system/Reveal";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Premium linen hire, Queenstown`,
    template: `%s · ${site.name}`,
  },
  description: site.shortDescription,
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: [
    "linen hire Queenstown",
    "wedding linen New Zealand",
    "event napkin hire",
    "scallop napkins",
    "custom branded napkins",
    "Olive Linen",
  ],
  openGraph: {
    title: site.name,
    description: site.shortDescription,
    url: site.url,
    siteName: site.name,
    locale: "en_NZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.shortDescription,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f1e6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ" className={cn(fontDisplay.variable, fontSans.variable)}>
      <body>
        {children}
        <Reveal />
      </body>
    </html>
  );
}

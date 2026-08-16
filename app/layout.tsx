import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { brand } from "@/lib/camcue/brand";
import { LocaleProvider } from "@/app/locale-provider";
import { cameras } from "@/lib/camcue/data/cameras";
import "./globals.css";

// Display face: condensed-feeling grotesque for the big uppercase statements.
// The `-face` suffix matters: globals.css composes these into --font-display /
// --font-sans / --font-mono stacks, and a variable cannot reference itself.
const archivo = Archivo({
  variable: "--display-face",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--sans-face",
  subsets: ["latin"],
});

// Spec data reads like an instrument readout.
const jetbrains = JetBrains_Mono({
  variable: "--mono-face",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  return {
    title: `${brand.name} — Camera Settings, Solved`,
    description: `${brand.tagline} Capability-checked recommendations for ${cameras.length} cameras.`,
    applicationName: brand.name,
    metadataBase: new URL(baseUrl),
    alternates: { canonical: brand.siteUrl },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: brand.name,
    },
    formatDetection: { telephone: false },
    openGraph: {
      title: `${brand.name} — Camera Settings, Solved`,
      description: brand.tagline,
      type: "website",
      url: baseUrl,
      siteName: brand.name,
      images: [{ url: `${baseUrl}/og-smartercapture.png`, width: 1200, height: 630, alt: `${brand.name} camera settings guide` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.name} — Camera Settings, Solved`,
      description: brand.tagline,
      images: [`${baseUrl}/og-smartercapture.png`],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0b0c",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${archivo.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  return {
    title: "CamCue — Camera Settings, Solved",
    description: "Tell CamCue what you're shooting and get compatible camera settings in seconds.",
    applicationName: "CamCue",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "CamCue",
    },
    formatDetection: { telephone: false },
    openGraph: {
      title: "CamCue — Camera Settings, Solved",
      description: "You shoot. We dial it in.",
      type: "website",
      url: baseUrl,
      images: [{ url: `${baseUrl}/og.png`, width: 1736, height: 905, alt: "CamCue camera settings card" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "CamCue — Camera Settings, Solved",
      description: "You shoot. We dial it in.",
      images: [`${baseUrl}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0d0c",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

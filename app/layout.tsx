import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/query-provider";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "AirCast — Personal streaming",
  description: "AirCast is a premium personal streaming platform for your private library — cinematic, fast, mobile-first.",
  appleWebApp: {
    title: "AirCast",
  },
  applicationName: "AirCast",
  themeColor: "#0a0a0b",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ]
  },
  openGraph: {
    title: "AirCast — Personal streaming",
    description: "AirCast Stream is a personal video streaming platform for watching HLS content.",
    type: "website",
    images: ["/apple-touch-icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AirCast — Personal streaming",
    description: "AirCast Stream is a personal video streaming platform for watching HLS content.",
    images: ["/apple-touch-icon.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${interTight.variable} font-sans bg-background text-foreground antialiased`}>
        <Providers>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

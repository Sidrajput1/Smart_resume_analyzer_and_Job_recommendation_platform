import type { Metadata } from "next";
import { Sora, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { checkDbConnection } from "@/lib/db";
import Provider from "./provider";

// const inter = Inter({subsets:['latin'],variable:'--font-sans'});

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-annotation",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Resume Portal",
  description: "AI-powered resume analysis and job recommendation platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // await checkDbConnection()
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        display.variable,
        body.variable,
        mono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

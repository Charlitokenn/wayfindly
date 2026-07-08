import type { Metadata } from "next";
import { Ubuntu, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { IdleSignInPrompt } from "@/components/auth/IdleSignInPrompt";

const ubuntu = Ubuntu({
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "boothfinder — Wayfinding & Lead Capture",
  description: "Efficient wayfinding and booth discovery for event attendees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${ubuntu.variable} ${jetbrainsMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          {children}
          <IdleSignInPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}

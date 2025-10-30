import type { Metadata } from "next";
import { Source_Sans_3 as FontSans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import FadeContent from "@/components/bits/FadeContent";

const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "JurisDraft - AI-Powered Legal Document Generation",
  description:
    "Generate professional legal documents in minutes with AI-powered precision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${fontSans.variable} font-sans antialiased`}>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <FadeContent>{children}</FadeContent>
            </main>
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

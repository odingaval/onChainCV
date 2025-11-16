import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import HeaderClient from "./header-client";
import MainContainer from "./main-container";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnchainCV",
  description: "Decentralized credentials",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[radial-gradient(1200px_800px_at_10%_10%,rgba(37,99,235,0.15),transparent),radial-gradient(1200px_800px_at_90%_0%,rgba(147,51,234,0.15),transparent)]`}>
        <Providers>
         <HeaderClient />
          <MainContainer>{children}</MainContainer>
        </Providers>
      </body>
    </html>
  );
}

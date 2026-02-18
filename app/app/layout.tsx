import type { Metadata } from "next";
import { Header } from "@/components/header";
import { OnboardingOverlay } from "@/components/onboarding-overlay";
import { WalletProvider } from "@/lib/wallet-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midnight DEX",
  description: "Example decentralized exchange built on Midnight",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <WalletProvider>
          <OnboardingOverlay />
          <Header />
          {/* Offset content below the fixed header */}
          <main className="mx-auto max-w-5xl px-4 pt-24 pb-12">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}

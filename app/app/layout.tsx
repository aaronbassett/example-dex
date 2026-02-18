import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}

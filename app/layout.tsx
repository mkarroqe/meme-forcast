import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech horoscope",
  description:
    "TechCrunch signals, Co-Star-style vibes, and an optional Memelord meme for your day in tech.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

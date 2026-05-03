import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech vibe forecast",
  description: "Top TechCrunch headlines, one meme forecast for your day in tech.",
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

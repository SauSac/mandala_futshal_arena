import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mandala Football Arena",
  description:
    "Floodlit five-a-side and full-size turf pitches. Book a slot, join a tournament, or sign up for the junior academy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
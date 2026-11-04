import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Runs before first paint: restores saved theme, enables reveal styles (no flash, no hydration mismatch).
const THEME_INIT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('bookin-theme');d.dataset.theme=t==='light'?'light':'dark'}catch(e){}d.classList.add('js')})();`;

export const metadata: Metadata = {
  title: "BookIN — Futsal Arena Discovery & Booking",
  description:
    "Discover premium futsal arenas, book your playing time, join tournaments, and bring your team together — all in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
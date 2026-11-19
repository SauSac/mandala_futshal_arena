
import type { Metadata } from "next";
import "./auth.css";

export const metadata: Metadata = {
  title: "BookIN — Login & Registration",
  description:
    "Sign in or create your BookIN account to discover futsal arenas and book your next game.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

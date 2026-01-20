import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi4",
  description: "Welcome to the Mi4 eco-system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

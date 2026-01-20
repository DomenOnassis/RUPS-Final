import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vezalko - Circuit Simulator",
  description: "Educational circuit and logic gate simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

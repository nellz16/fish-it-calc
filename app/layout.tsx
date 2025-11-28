// app/layout.tsx
import "./../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RNG Calculator Fish It",
  description: "Kalkulator peluang ikan langka untuk game Fish It (Roblox)"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PalaTime — Adapta tu CV a cada oferta con IA",
  description: "Creá tu CV y adaptalo automáticamente a cada oferta laboral.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

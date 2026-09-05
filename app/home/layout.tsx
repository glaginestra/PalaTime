import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "PalaTime",
  description: "Creá tu CV y adaptalo automáticamente a cada oferta laboral.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

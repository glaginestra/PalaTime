"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasBaseCv } from "@/lib/cv-storage";

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [showAdaptWarning, setShowAdaptWarning] = useState(false);

  useEffect(() => {
    // Si ya hay un CV base guardado, no tiene sentido mostrar el home:
    // se va directo a la pantalla principal (equivalente a "usuario logueado
    // con CV base" en el diagrama de ruteo). Sin auth todavía, este chequeo
    // reemplaza temporalmente a esa condición.
    if (hasBaseCv()) {
      router.replace("/cv");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center mb-10">
        <h1 className="text-2xl font-semibold mb-2">¿Cómo querés empezar?</h1>
        <p className="text-neutral-600 text-sm">
          Te guiamos sección por sección y dejamos tu CV listo para adaptarlo a cada oferta.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        <OptionCard
          title="Crear un CV nuevo"
          description="Formulario guiado, con preview en vivo mientras lo completás."
          cta="Crear"
          onClick={() => router.push("/crear")}
        />
        <OptionCard
          title="Subir mi CV"
          description="Importá tu PDF o Word y lo convertimos en un CV editable."
          cta="Subir"
          onClick={() => router.push("/crear?import=1")}
        />
        <OptionCard
          title="Adaptar CV"
          description="Pegá una oferta laboral y ajustamos tu CV base a lo que pide."
          cta="Adaptar"
          onClick={() => setShowAdaptWarning(true)}
        />
      </div>

      {showAdaptWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="font-semibold mb-2">Necesitás un CV base primero</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Para adaptar un CV a una oferta primero tenés que crear uno o importar el tuyo.
              Una vez que lo tengas, "Adaptar" va a estar disponible.
            </p>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={() => router.push("/crear")}>
                Crear CV
              </button>
              <button className="btn-secondary flex-1" onClick={() => router.push("/crear?import=1")}>
                Subir CV
              </button>
            </div>
            <button
              className="text-xs text-neutral-400 mt-3"
              onClick={() => setShowAdaptWarning(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function OptionCard({
  title,
  description,
  cta,
  onClick,
}: {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="border border-neutral-200 rounded-xl p-5 flex flex-col bg-white">
      <p className="font-medium mb-1.5">{title}</p>
      <p className="text-sm text-neutral-500 flex-1 mb-4">{description}</p>
      <button className="btn-secondary" onClick={onClick}>
        {cta}
      </button>
    </div>
  );
}

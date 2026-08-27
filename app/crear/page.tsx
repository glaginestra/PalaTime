"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CvForm from "@/components/CvForm";
import CvPreview from "@/components/CvPreview";
import { Cv } from "@/lib/cv-schema";
import { emptyCv, saveBaseCv } from "@/lib/cv-storage";

export default function CrearPage() {
  return (
    <Suspense fallback={null}>
      <CrearPageContent />
    </Suspense>
  );
}

function CrearPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isImport = searchParams.get("import") === "1";

  const [cv, setCv] = useState<Cv>(emptyCv());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedOk, setImportedOk] = useState(false);

  async function handleFileUpload(file: File) {
    setImporting(true);
    setImportError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-cv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "No pudimos procesar el archivo.");
        return;
      }
      setCv(data.cv);
      setImportedOk(true);
    } catch {
      setImportError("Error de conexión al procesar el archivo.");
    } finally {
      setImporting(false);
    }
  }

  function handleFinish() {
    saveBaseCv(cv);
    router.push("/cv");
  }

  return (
    <main className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6 lg:p-10 lg:max-h-screen lg:overflow-y-auto">
          <h1 className="text-lg font-semibold mb-1">
            {isImport ? "Subí tu CV" : "Creá tu CV"}
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            {isImport
              ? "Aceptamos PDF y Word. Vas a poder revisar y corregir todo antes de guardarlo."
              : "Completá cada sección. A la derecha vas viendo cómo va quedando."}
          </p>

          {isImport && !importedOk && (
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center mb-6">
              <input
                type="file"
                accept=".pdf,.docx"
                id="file-input"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <label htmlFor="file-input" className="btn-secondary cursor-pointer inline-block">
                {importing ? "Procesando..." : "Elegir archivo (PDF o Word)"}
              </label>
              {importError && (
                <p className="text-sm text-red-600 mt-3">{importError}</p>
              )}
            </div>
          )}

          {isImport && importedOk && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mb-6">
              Extrajimos esta información automáticamente. Revisala y corregí lo que haga falta
              antes de guardar — el parseo puede equivocarse, sobre todo en CVs con diseño gráfico.
            </div>
          )}

          {(!isImport || importedOk) && (
            <CvForm cv={cv} onChange={setCv} onFinish={handleFinish} />
          )}
        </div>

        <div className="hidden lg:block bg-neutral-50 border-l border-neutral-200 p-10 sticky top-0 h-screen overflow-y-auto">
          <CvPreview cv={cv} />
        </div>
      </div>
    </main>
  );
}

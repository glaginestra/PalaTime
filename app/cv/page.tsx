"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CvForm from "@/components/CvForm";
import CvPreview from "@/components/CvPreview";
import { Cv, CvSchema, emptyCv } from "@/lib/cv-schema";
import {
  getBaseCv,
  saveBaseCv,
  listAdaptations,
  getAdaptation,
  updateAdaptation,
  AdaptationRecord,
} from "@/lib/cv-storage";

type ViewMode = "amigable" | "json";

export default function CvRenderPage() {
  return (
    <Suspense fallback={null}>
      <CvRenderPageContent />
    </Suspense>
  );
}

function CvRenderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adaptationId = searchParams.get("adaptation");

  const [cv, setCv] = useState<Cv | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("amigable");
  const [adaptations, setAdaptations] = useState<AdaptationRecord[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const record = adaptationId ? getAdaptation(adaptationId) : null;
    const loaded = record ? record.cv : getBaseCv();
    if (!loaded) {
      router.replace("/");
      return;
    }
    setCv(loaded);
    setJsonDraft(JSON.stringify(loaded, null, 2));
    setAdaptations(listAdaptations());
  }, [adaptationId, router]);

  const title = useMemo(() => {
    if (!adaptationId) return "Tu CV base";
    const record = getAdaptation(adaptationId);
    return record ? `${record.jobTitle} — ${record.company}` : "Adaptación";
  }, [adaptationId]);

  function persist(next: Cv) {
    setCv(next);
    setJsonDraft(JSON.stringify(next, null, 2));
    if (adaptationId) {
      updateAdaptation(adaptationId, next);
    } else {
      saveBaseCv(next);
    }
  }

  function applyJsonDraft() {
    try {
      const parsed = JSON.parse(jsonDraft);
      const result = CvSchema.safeParse(parsed);
      if (!result.success) {
        setJsonError("El JSON no tiene el formato esperado. Revisá los campos obligatorios.");
        return;
      }
      setJsonError(null);
      persist(result.data);
    } catch {
      setJsonError("JSON inválido: revisá comas, llaves o comillas.");
    }
  }

  async function handleDownload() {
    if (!cv) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv }),
      });
      if (!res.ok) throw new Error("Fallo al generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV_${cv.personalInfo.fullName.replace(/\s+/g, "_") || "palatime"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (!cv) return null;

  return (
    <main className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r border-neutral-200 bg-white p-4 flex flex-col">
        <p className="font-semibold text-sm mb-4">PalaTime</p>

        <nav className="space-y-1 mb-6">
          <SidebarButton label="Crear nuevo CV" onClick={() => router.push("/crear")} />
          <SidebarButton label="Subir CV" onClick={() => router.push("/crear?import=1")} />
          <SidebarButton label="Adaptar CV" onClick={() => router.push("/adaptar")} highlight />
        </nav>

        <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Tus CVs</p>
        <div className="space-y-1 overflow-y-auto">
          <FileItem
            label="CV base"
            active={!adaptationId}
            onClick={() => router.push("/cv")}
          />
          {adaptations.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] text-neutral-400 px-2 mb-1">Adaptaciones</p>
              {adaptations.map((a) => (
                <FileItem
                  key={a.id}
                  label={`${a.jobTitle} — ${a.company}`}
                  active={adaptationId === a.id}
                  onClick={() => router.push(`/cv?adaptation=${a.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6 lg:max-h-screen lg:overflow-y-auto border-r border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-sm font-semibold">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ToggleButton active={mode === "amigable"} onClick={() => setMode("amigable")}>
                Amigable
              </ToggleButton>
              <ToggleButton active={mode === "json"} onClick={() => setMode("json")}>
                JSON
              </ToggleButton>
            </div>
          </div>

          {mode === "amigable" ? (
            <CvForm cv={cv} onChange={persist} onFinish={() => {}} />
          ) : (
            <div>
              <textarea
                className="w-full h-[70vh] font-mono text-xs border border-neutral-300 rounded-md p-3"
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
              />
              {jsonError && <p className="text-xs text-red-600 mt-2">{jsonError}</p>}
              <button className="btn-secondary mt-2" onClick={applyJsonDraft}>
                Aplicar cambios
              </button>
            </div>
          )}
        </div>

        <div className="p-8 bg-neutral-50 lg:sticky lg:top-0 lg:h-screen overflow-y-auto">
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>
          <CvPreview cv={cv} />
        </div>
      </section>
    </main>
  );
}

function SidebarButton({
  label,
  onClick,
  highlight,
}: {
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm px-3 py-2 rounded-md transition ${
        highlight
          ? "bg-neutral-900 text-white hover:bg-neutral-800"
          : "hover:bg-neutral-100 text-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}

function FileItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-xs px-2 py-1.5 rounded-md truncate ${
        active ? "bg-neutral-100 font-medium" : "hover:bg-neutral-50 text-neutral-600"
      }`}
      title={label}
    >
      {label}
    </button>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border ${
        active
          ? "bg-neutral-900 text-white border-neutral-900"
          : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );
}

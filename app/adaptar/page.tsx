"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CvPreview from "@/components/CvPreview";
import { getBaseCv, saveAdaptation } from "@/lib/cv-storage";
import { Cv } from "@/lib/cv-schema";

function guessTitleAndCompany(text: string): { title: string; company: string } {
  const firstLine = text.trim().split("\n").find((l) => l.trim().length > 3) ?? "";
  return { title: firstLine.slice(0, 60) || "Puesto sin nombre", company: "Empresa" };
}

export default function AdaptarPage() {
  const router = useRouter();
  const [baseCv, setBaseCv] = useState<Cv | null>(null);
  const [jobPosting, setJobPosting] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cv = getBaseCv();
    if (!cv) {
      router.replace("/");
      return;
    }
    setBaseCv(cv);
  }, [router]);

  useEffect(() => {
    if (jobPosting.trim().length > 20 && !jobTitle) {
      const guess = guessTitleAndCompany(jobPosting);
      setJobTitle(guess.title);
      setCompany(guess.company);
    }
  }, [jobPosting, jobTitle]);

  async function handleAdapt() {
    if (!baseCv) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseCv, jobPosting }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos generar la adaptación.");
        return;
      }
      const id = `adapt_${Math.random().toString(36).slice(2, 9)}`;
      saveAdaptation({
        id,
        jobTitle: jobTitle || "Puesto",
        company: company || "Empresa",
        createdAt: new Date().toISOString(),
        cv: data.cv,
      });
      router.push(`/cv?adaptation=${id}`);
    } catch {
      setError("Error de conexión al adaptar el CV.");
    } finally {
      setLoading(false);
    }
  }

  if (!baseCv) return null;

  const canAdapt = jobPosting.trim().length >= 30;

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="p-8 border-r border-neutral-200">
        <h1 className="text-sm font-semibold mb-1">Tu CV base</h1>
        <p className="text-xs text-neutral-500 mb-4">
          Esto es lo que vamos a adaptar a la oferta.
        </p>
        <CvPreview cv={baseCv} />
      </div>

      <div className="p-8 flex flex-col">
        <h1 className="text-sm font-semibold mb-1">Oferta laboral</h1>
        <p className="text-xs text-neutral-500 mb-4">
          Pegá el texto completo de la oferta (descripción, requisitos, etc).
        </p>

        <textarea
          className="input flex-1 min-h-[300px] font-mono text-xs"
          placeholder="Pegá acá el texto de la oferta laboral..."
          value={jobPosting}
          onChange={(e) => setJobPosting(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <label className="block">
            <span className="text-xs text-neutral-600 mb-1 block">Puesto</span>
            <input className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600 mb-1 block">Empresa</span>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <button
          className="btn-primary mt-6"
          disabled={!canAdapt || loading}
          onClick={handleAdapt}
        >
          {loading ? "Adaptando..." : "Adaptar CV"}
        </button>
      </div>
    </main>
  );
}

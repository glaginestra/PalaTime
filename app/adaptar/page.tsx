"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CvPreview from "@/components/CvPreview";
import { getBaseCv, saveAdaptation } from "@/lib/cv-storage";
import { Cv } from "@/lib/cv-schema";
import { Moon, Sun, ArrowLeft, Sparkles, Building2, Briefcase } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function guessTitleAndCompany(text: string): { title: string; company: string } {
  const firstLine = text.trim().split("\n").find((l) => l.trim().length > 3) ?? "";
  return { title: firstLine.slice(0, 60) || "Puesto solicitado", company: "Empresa" };
}

export default function AdaptarPage() {
  const router = useRouter();
  const [baseCv, setBaseCv] = useState<Cv | null>(null);
  const [jobPosting, setJobPosting] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modo oscuro/claro coherente con el resto de la app
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session;

  // Redirige al home si NO está logueado
  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push("/"); 
    }
  }, [isAuthenticated, isPending, router]);

  // Si está cargando o NO está autenticado, no renderiza nada para evitar parpadeos
  if (isPending || !isAuthenticated) return null;

  useEffect(() => {
    const savedTheme = localStorage.getItem("palatime_dark_mode");
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === "true");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("palatime_dark_mode", String(nextMode));
  };

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
      setError("Error de conexión al procesar la adaptación con IA.");
    } finally {
      setLoading(false);
    }
  }

  if (!baseCv) return null;

  const canAdapt = jobPosting.trim().length >= 30;

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${isDarkMode ? "bg-[#090D16] text-[#F8FAFC]" : "bg-[#F1F5F9] text-[#0F172A]"}`}>
      
      {/* 1. BARRA LATERAL IZQUIERDA (Preview del CV Base) */}
      <aside className={`w-[45%] flex flex-col border-r shrink-0 overflow-hidden ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-white border-neutral-200"}`}>
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "border-[#F8FAFC]/10" : "border-neutral-200"}`}>
          <button 
            onClick={() => router.push("/")} 
            className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono opacity-60">CV Base Actual</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex items-center justify-center">
          <div className={`w-full max-w-xl h-full rounded-2xl p-6 shadow-xl overflow-y-auto border ${isDarkMode ? "bg-[#1D293D]/40 border-white/10" : "bg-neutral-50 border-neutral-200"}`}>
            <div className="mb-4">
              <h2 className="text-sm font-bold">Vista previa de referencia</h2>
              <p className="text-[11px] opacity-60">Este contenido base será reestructurado por IA.</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-neutral-900 shadow-md">
              <CvPreview cv={baseCv} />
            </div>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL (Formulario de Adaptación) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header superior con selector de tema */}
        <header className={`flex items-center justify-between px-8 py-4 border-b shrink-0 ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-white border-neutral-200"}`}>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Adaptación Inteligente con IA</h1>
            <p className="text-[11px] opacity-60">Optimiza palabras clave y perfil técnico para superar filtros ATS.</p>
          </div>
          
          <button 
            onClick={toggleDarkMode} 
            className={`p-2 rounded-lg border transition ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/10 text-amber-400 hover:bg-[#25364f]" : "bg-neutral-100 border-neutral-300 text-slate-700 hover:bg-neutral-200"}`}
            title="Cambiar Modo Oscuro / Claro"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* Contenedor del Formulario */}
        <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full flex flex-col justify-center space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-80 block">
              Descripción de la oferta laboral
            </label>
            <textarea
              className={`w-full h-48 rounded-xl p-4 text-xs font-mono placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border ${isDarkMode ? "bg-[#1D293D]/40 border-white/10 text-white" : "bg-white border-neutral-300 text-neutral-900 shadow-sm"}`}
              placeholder="Pegá aquí el texto completo de la oferta de empleo (requisitos, responsabilidades, stack tecnológico)..."
              value={jobPosting}
              onChange={(e) => setJobPosting(e.target.value)}
            />
            <div className="flex justify-between items-center text-[11px] opacity-60 px-1">
              <span>Mínimo 30 caracteres requeridos</span>
              <span>{jobPosting.trim().length} / 30</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium opacity-80 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Puesto objetivo
              </label>
              <input 
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border ${isDarkMode ? "bg-[#1D293D]/40 border-white/10 text-white" : "bg-white border-neutral-300 text-neutral-900 shadow-sm"}`}
                value={jobTitle} 
                onChange={(e) => setJobTitle(e.target.value)} 
                placeholder="Ej. Senior Backend Developer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium opacity-80 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" /> Empresa
              </label>
              <input 
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border ${isDarkMode ? "bg-[#1D293D]/40 border-white/10 text-white" : "bg-white border-neutral-300 text-neutral-900 shadow-sm"}`}
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
                placeholder="Ej. TechCorp"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={!canAdapt || loading}
            onClick={handleAdapt}
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Optimizando CV con Inteligencia Artificial..." : "Generar CV Adaptado"}
          </button>

        </div>
      </main>
    </div>
  );
}
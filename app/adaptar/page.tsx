"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveAdaptation } from "@/lib/cv-storage";
import { Moon, Sun, ArrowLeft, Sparkles, Building2, Briefcase, CheckCircle2, ShieldCheck, Download } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import * as yaml from "js-yaml";

function guessTitleAndCompany(text: string): { title: string; company: string } {
  const firstLine = text.trim().split("\n").find((l) => l.trim().length > 3) ?? "";
  return { title: firstLine.slice(0, 60) || "Puesto solicitado", company: "Empresa" };
}

function extractKeywords(text: string): string[] {
  const commonTech = ["react", "next.js", "typescript", "python", "docker", "kubernetes", "tailwind", "node.js", "postgresql", "prisma", "aws", "git", "agile", "scrum", "graphql", "rest api"];
  const lower = text.toLowerCase();
  return commonTech.filter(tech => lower.includes(tech));
}

export default function AdaptarPage() {
  const router = useRouter();
  const [userCvs, setUserCvs] = useState<any[]>([]);
  const [selectedBaseCvId, setSelectedBaseCvId] = useState<string | null>(null);
  const [activeYamlContent, setActiveYamlContent] = useState<string>("");

  const [jobPosting, setJobPosting] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Estados para el PDF en vivo con iframe
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session;

  const detectedKeywords = useMemo(() => extractKeywords(jobPosting), [jobPosting]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(1);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push("/"); 
    }
  }, [isAuthenticated, isPending, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("palatime_dark_mode");
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === "true");
    }
  }, []);

  // Cargar CVs del usuario
  useEffect(() => {
    const fetchUserCvs = async () => {
      try {
        const res = await fetch("/api/cvs");
        if (res.ok) {
          const data = await res.json();
          const cvs = data.cvs || [];
          setUserCvs(cvs);
          if (cvs.length > 0) {
            setSelectedBaseCvId(cvs[0].id);
            setActiveYamlContent(cvs[0].yamlContent);
          }
        }
      } catch (e) {
        console.error("Error al obtener CVs para adaptar:", e);
      }
    };
    if (isAuthenticated) {
      fetchUserCvs();
    }
  }, [isAuthenticated]);

  // Efecto para compilar el PDF en vivo usando /api/pdf cada vez que cambie el YAML
  useEffect(() => {
    if (!activeYamlContent) return;

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yaml_content: activeYamlContent }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl((prevUrl) => {
            if (prevUrl) URL.revokeObjectURL(prevUrl);
            return url;
          });
          setCompileError(null);
        } else {
          const data = await res.json();
          setCompileError(data.error || "Error al compilar PDF");
        }
      } catch (err) {
        console.error("Error de conexión al renderizar PDF:", err);
        setCompileError("Error de conexión con el servicio de PDF.");
      }
    }, 400);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [activeYamlContent]);

  useEffect(() => {
    if (jobPosting.trim().length > 20 && !jobTitle) {
      const guess = guessTitleAndCompany(jobPosting);
      setJobTitle(guess.title);
      setCompany(guess.company);
    }
  }, [jobPosting, jobTitle]);

  if (isPending || !isAuthenticated) return null;

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("palatime_dark_mode", String(nextMode));
  };

  const handleSelectCv = (cvId: string) => {
    const found = userCvs.find(c => c.id === cvId);
    if (found) {
      setSelectedBaseCvId(found.id);
      setActiveYamlContent(found.yamlContent);
    }
  };

  async function handleAdapt() {
    if (!activeYamlContent) return;
    setLoading(true);
    setError(null);
    try {
      let parsedCvObj;
      try {
        const loaded = yaml.load(activeYamlContent) as any;
        parsedCvObj = loaded?.cv ? loaded.cv : loaded;
      } catch {
        parsedCvObj = activeYamlContent;
      }

      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseCv: { cv: parsedCvObj }, jobPosting }),
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

  const canAdapt = jobPosting.trim().length >= 30 && activeYamlContent !== "";

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${isDarkMode ? "bg-[#090D16] text-[#F8FAFC]" : "bg-[#F1F5F9] text-[#0F172A]"}`}>
      
      {/* 1. BARRA LATERAL IZQUIERDA (Selector y Vista Previa PDF con iframe) */}
      <aside className={`w-[45%] flex flex-col border-r shrink-0 overflow-hidden ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-white border-neutral-200"}`}>
        <div className={`p-[21.45px] border-b flex items-center justify-between shrink-0 ${isDarkMode ? "border-[#F8FAFC]/10" : "border-neutral-200"}`}>
          <button 
            onClick={() => router.push("/")} 
            className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al estudio
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] opacity-60">Base:</span>
            <select
              value={selectedBaseCvId || ""}
              onChange={(e) => handleSelectCv(e.target.value)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${isDarkMode ? "bg-[#1D293D] border-white/20 text-white" : "bg-neutral-100 border-neutral-300 text-slate-800"}`}
            >
              {userCvs.map((cv) => (
                <option key={cv.id} value={cv.id} className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>
                  {cv.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Panel de PDF en Vivo con iframe */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isDarkMode ? "bg-[#090D16]" : "bg-neutral-100"}`}>

          <div className="flex-1 relative flex items-center justify-center overflow-y-auto">
            {compileError ? (
              <div className="bg-red-950/90 border border-red-700 text-red-200 p-4 rounded-xl max-w-md text-xs shadow-2xl">
                <p className="font-bold mb-1">Error al generar PDF:</p>
                <pre className="whitespace-pre-wrap font-mono">{compileError}</pre>
              </div>
            ) : pdfUrl ? (
              <div className={`w-full h-full relative overflow-hidden shadow-2xl border ${isDarkMode ? "border-[#F8FAFC]/20 bg-[#1e293b]" : "border-neutral-300 bg-white"}`}>
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#2b2b2b] pointer-events-none z-10 flex items-center px-4"></div>
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className={`w-full h-[calc(100%+40px)] -mt-8 border-0 ${isDarkMode ? "bg-[#1E293B]" : "bg-white"}`}
                  title="Vista Previa"
                />
              </div>
            ) : (
              <p className="text-xs opacity-60 animate-pulse">Generando vista previa del PDF...</p>
            )}
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL (Formulario de Adaptación) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className={`flex items-center justify-between px-8 py-4 border-b shrink-0 ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-white border-neutral-200"}`}>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Adaptación Inteligente de Perfil</h1>
            <p className="text-[11px] opacity-60">Sincroniza tus logros con los requisitos exactos de la vacante.</p>
          </div>
          
          <button 
            onClick={toggleDarkMode} 
            className={`p-2 rounded-lg border transition ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/10 text-amber-400 hover:bg-[#25364f]" : "bg-neutral-100 border-neutral-300 text-slate-700 hover:bg-neutral-200"}`}
            title="Cambiar Modo Oscuro / Claro"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full flex flex-col justify-center space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider opacity-80 block">
              Pegar descripción de la oferta laboral
            </label>
            <textarea
              className={`w-full min-h-80 max-h-80 rounded-xl p-4 text-xs font-mono placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border ${isDarkMode ? "bg-[#1D293D]/40 border-white/10 text-white" : "bg-white border-neutral-300 text-neutral-900 shadow-sm"}`}
              placeholder="Ej: Buscamos un Desarrollador con sólida experiencia en React, TypeScript y arquitectura de software..."
              value={jobPosting}
              onChange={(e) => setJobPosting(e.target.value)}
            />
            <div className="flex justify-between items-center text-[11px] opacity-60 px-1">
              <span>Mínimo 30 caracteres requeridos</span>
              <span className={jobPosting.trim().length >= 30 ? "text-emerald-400 font-bold" : ""}>
                {jobPosting.trim().length} / 30 caracteres
              </span>
            </div>
          </div>

          {detectedKeywords.length > 0 && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-300 ${isDarkMode ? "bg-blue-950/20 border-blue-500/30 text-blue-200" : "bg-blue-50 border-blue-200 text-blue-900"}`}>
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Palabras clave detectadas para inyectar en tu CV:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {detectedKeywords.map((kw, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${isDarkMode ? "bg-blue-900/50 text-blue-300 border border-blue-500/30" : "bg-white text-blue-700 border border-blue-200"}`}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium opacity-80 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Puesto objetivo
              </label>
              <input 
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border ${isDarkMode ? "bg-[#1D293D]/40 border-white/10 text-white" : "bg-white border-neutral-300 text-neutral-900 shadow-sm"}`}
                value={jobTitle} 
                onChange={(e) => setJobTitle(e.target.value)} 
                placeholder="Ej. Full Stack Engineer"
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            disabled={!canAdapt || loading}
            onClick={handleAdapt}
          >
            <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? (
              <span>
                {loadingStep === 1 && "Analizando requerimientos de la oferta..."}
                {loadingStep === 2 && "Alineando palabras clave para filtros ATS..."}
                {loadingStep === 3 && "Optimizando redacción y métricas de impacto..."}
              </span>
            ) : (
              "Generar CV Adaptado"
            )}
          </button>

        </div>
      </main>
    </div>
  );
}
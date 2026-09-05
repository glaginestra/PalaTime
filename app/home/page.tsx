"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { hasBaseCv } from "@/lib/cv-storage";
import { authClient } from "@/lib/auth-client";
import { Sparkles, ArrowRight, ShieldCheck, FileText, Upload, Wand2, CheckCircle2 } from "lucide-react";


// Lista de formatos con imágenes verticales de ejemplo (puedes reemplazar los src por tus capturas reales)
const cvFormats = [
  { name: "Classic", src: "/CV-classic.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Ember", src: "/CV-ember.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Engineering Classic", src: "/CV-engineeringclassic.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Modern CV", src: "/CV-moderncv.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Opal", src: "/CV-opal.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Harvard", src: "/CV-harvard.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Engineering Resumes", src: "/CV-engineeringresumes.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Ink", src: "/CV-ink.png?w=500&auto=format&fit=crop&q=60" },
  { name: "Sb2Nov", src: "/CV-sb2nov.png?w=500&auto=format&fit=crop&q=60" },
];

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [showAdaptWarning, setShowAdaptWarning] = useState(false);
  const [isBaseCvMissing, setIsBaseCvMissing] = useState(false);
  const [shouldHighlightLogin, setShouldHighlightLogin] = useState(false);

  // Loop infinito horizontal automático para el cilindro 3D lateral
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cvFormats.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const loginSectionRef = useRef<HTMLDivElement>(null);

  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session;

  useEffect(() => {
    setChecked(true);
    setIsBaseCvMissing(!hasBaseCv());
  }, [router]);

  if (!checked || isPending) return null;

  const triggerLoginAttention = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    setShouldHighlightLogin(true);
    setTimeout(() => setShouldHighlightLogin(false), 2000);
  };

  const handleProtectedAction = (destination: string) => {
    if (!isAuthenticated) {
      triggerLoginAttention();
      return;
    }
    router.push(destination);
  };

  const handleAdaptClick = () => {
    if (!isAuthenticated) {
      triggerLoginAttention();
      return;
    }
    if (!hasBaseCv()) {
      setShowAdaptWarning(true);
    } else {
      router.push("/adaptar");
    }
  };

  return (
    <main className="min-h-screen bg-[#070324] text-slate-100 flex flex-col justify-between px-6 py-8 selection:bg-[#63FFF9] selection:text-[#0B0054] relative overflow-hidden font-sans">
      
      {/* Elementos lumínicos de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-[#63FFF9]/10 via-blue-600/15 to-transparent blur-[160px] pointer-events-none rounded-full z-0" />

      {/* --- TUBO 3D HORIZONTAL DE CAPTURAS VERTICALES (Z-index bajo para que quede por debajo de la UI) --- */}
      <aside className="hidden xl:block absolute -right-4 top-[31%] -translate-y-1/2 z-10 w-[420px] h-[600px] pointer-events-none perspective-[1400px]">
        <div className="relative w-full h-full flex items-center justify-center">
          {cvFormats.map((format, index) => {
            // Cálculo exacto de la distancia circular más corta para loop infinito sin saltos
            let offset = (index - currentIndex + cvFormats.length) % cvFormats.length;
            if (offset > cvFormats.length / 2) {
              offset -= cvFormats.length;
            }

            // Solo renderizamos la tarjeta central (0), la izquierda (-1) y la derecha (1)
            if (Math.abs(offset) > 1) return null;

            let transform = "";
            let opacity = 0;
            let zIndex = 0;

            if (offset === 0) {
              // Tarjeta Central: Recta, vertical, de frente
              transform = "translateX(0px) translateZ(0px) rotateY(0deg) scale(1)";
              opacity = 1;
              zIndex = 20;
            } else if (offset === -1) {
              // Tarjeta Izquierda: Doblada horizontalmente simulando el cilindro
              transform = "translateX(-180px) translateZ(-160px) rotateY(55deg) scale(0.85)";
              opacity = 0.35;
              zIndex = 5;
            } else if (offset === 1) {
              // Tarjeta Derecha: Doblada horizontalmente simulando el cilindro
              transform = "translateX(150px) translateZ(-160px) rotateY(-55deg) scale(0.85)";
              opacity = 0.35;
              zIndex = 5;
            }

            return (
              <div
                key={format.name}
                style={{
                  transform,
                  opacity,
                  zIndex,
                  transformStyle: "preserve-3d",
                  transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="absolute w-[450px] h-[630px] rounded-2xl overflow-hidden border border-white/20 bg-slate-900 shadow-2xl backdrop-blur-md"
              >
                <img 
                  src={format.src} 
                  alt={format.name} 
                  className="w-full h-full object-cover filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070324]/90 via-transparent to-transparent flex items-end p-4">
                  <span className="text-xs font-bold text-white tracking-wide">{format.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Navbar Minimalista (Z-index superior 50) */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#63FFF9] to-blue-500 flex items-center justify-center font-black text-[#070324] text-lg shadow-lg shadow-[#63FFF9]/20 transition-transform group-hover:scale-105">
            P
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
            Palatime <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#63FFF9]/10 text-[#63FFF9] border border-[#63FFF9]/20">MVP</span>
          </span>
        </div>
        
      </header>

      {/* Hero Central (Z-index superior 50) */}
      <div className="w-full max-w-4xl mx-auto text-center my-auto py-12 relative z-50">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#63FFF9]/10 border border-[#63FFF9]/25 text-[#63FFF9] text-xs font-semibold mb-6 backdrop-blur-md shadow-inner">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Optimización de CV impulsada por Inteligencia Artificial</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
          Tu próximo empleo <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#63FFF9] via-blue-200 to-indigo-300 drop-shadow-sm">
            empieza con un CV perfecto.
          </span>
        </h1>
        
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-12 font-normal leading-relaxed">
          Diseñá, importá o adaptá tu currículum a cada oferta laboral en segundos. Resultados profesionales diseñados para superar cualquier filtro ATS.
        </p>

        {/* Tarjetas de Acción Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left w-full mb-16">
          <OptionCard
            icon={<FileText className="w-5 h-5 text-[#63FFF9]" />}
            title="Crear desde cero"
            description="Formulario guiado con previsualización en vivo en tiempo real."
            cta="Crear CV"
            onClick={() => router.push("/")}
          />
          <OptionCard
            icon={<Upload className="w-5 h-5 text-blue-400" />}
            title="Subir archivo"
            description="Importá tu PDF o Word actual y convertilo en formato editable con IA."
            cta="Subir PDF / Word"
            onClick={() => handleProtectedAction("/")}
          />
          <OptionCard
            icon={<Wand2 className="w-5 h-5 text-purple-400" />}
            title="Adaptar a oferta"
            description="Pegá los requisitos del puesto y ajustá tu perfil automáticamente."
            cta="Adaptar CV"
            onClick={handleAdaptClick}
            highlight={isBaseCvMissing}
          />
        </div>

        {/* Sección de Autenticación Integrada (Single Page Login) */}
        {!isAuthenticated && (
          <div 
            ref={loginSectionRef}
            className={`w-full max-w-xl mx-auto bg-[#10074a]/95 border rounded-3xl px-8 py-6 backdrop-blur-2xl shadow-2xl transition-all duration-500 relative overflow-hidden ${
              shouldHighlightLogin 
                ? "border-[#63FFF9] ring-8 ring-[#63FFF9]/20 scale-105 shadow-[#63FFF9]/20" 
                : "border-white/10 shadow-black/50"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#63FFF9]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-center gap-2 mb-3 text-[#63FFF9]">
              <ShieldCheck size={28} />
              <h3 className="font-bold text-xl text-white">Listo para empezar a usar PalaTime?</h3>
            </div>
            <button
              onClick={async () => {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/",
                });
              }}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/30 group cursor-pointer active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.22 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.4l4.09-3.16z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.99 6.73-4.99z"/>
              </svg>
              <span>Continuar con Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-500" />
            </button>
            <p className="mt-3">
              <span onClick={() => router.push("/")} className="text-xs text-slate-300 leading-relaxed text-center hover:underline cursor-pointer">
                  O entrá como invitado
              </span>
            </p>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed text-center">
              Al continuar, aceptas nuestras {" "}
              <span onClick={() => router.push("/condiciones-de-servicio")} className="text-slate-300 underline cursor-pointer ">
                Condiciones de servicio
              </span>
              {" "}y nuestra {" "}
              <span onClick={() => router.push("/politica-de-privacidad")} className="text-slate-300 underline cursor-pointer ">
                Política de privacidad
              </span>
              .
            </p>
          </div>
        )}
      </div>

      {/* Footer minimalista (Z-index superior 50) */}
      <footer className="w-full max-w-6xl mx-auto text-center text-xs text-slate-500 py-6 border-t border-white/5 relative z-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>Palatime MVP &copy; {new Date().getFullYear()} &mdash; Hecho para destacar tu perfil profesional.</span>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Prisma v6 Conectado</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Better Auth Seguro</span>
        </div>
      </footer>

      {/* Modal de Advertencia (CV Base Faltante) */}
      {showAdaptWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center px-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-[#120566] border border-[#63FFF9]/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#63FFF9]/10 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-white font-extrabold text-xl mb-3">Necesitás un CV base primero</h2>
            <p className="text-sm text-slate-300 mb-7 leading-relaxed">
              Para cruzar tu perfil con las exigencias de una oferta laboral, primero necesitamos registrar tus datos principales. Creá uno nuevo o subí tu CV actual para continuar.
            </p>
            <div className="flex gap-3">
              <button 
                className="flex-1 bg-[#63FFF9] text-[#0B0054] font-extrabold py-3.5 rounded-2xl text-xs hover:opacity-90 transition-all shadow-lg shadow-[#63FFF9]/15 cursor-pointer" 
                onClick={() => router.push("/crear")}
              >
                Crear CV nuevo
              </button>
              <button 
                className="flex-1 border border-white/20 text-white text-xs font-semibold py-3.5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer" 
                onClick={() => router.push("/importar")}
              >
                Subir archivo
              </button>
            </div>
            <button
              className="w-full text-xs text-slate-400 mt-5 text-center hover:text-white transition-colors cursor-pointer"
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
  icon,
  title,
  description,
  cta,
  onClick,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div className="border border-white/10 hover:border-[#63FFF9]/40 transition-all duration-300 rounded-3xl p-7 flex flex-col bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-xl shadow-xl group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      <h3 className="font-bold text-white text-lg mb-2 group-hover:text-[#63FFF9] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-300 flex-1 mb-8 leading-relaxed font-normal">
        {description}
      </p>
      
      <button 
        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
          highlight 
            ? "border border-[#63FFF9]/50 text-white hover:bg-[#63FFF9]/10 shadow-sm" 
            : "bg-[#63FFF9] text-[#070324] hover:opacity-95 shadow-md shadow-[#63FFF9]/10 group-hover:shadow-[#63FFF9]/20"
        }`} 
        onClick={onClick}
      >
        <span>{cta}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
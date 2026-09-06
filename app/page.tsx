"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import * as yaml from "js-yaml";
import { Cv } from "@/lib/cv-schema";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";
import { Download, Plus, Upload, Moon, Sun, FileUser, HelpCircle, LogOut, X, ChevronLeft, ChevronRight, User, MoreVertical, Edit2, Trash2, CloudOff,Sparkles } from 'lucide-react';
import { hasBaseCv } from "@/lib/cv-storage";
import { authClient } from "@/lib/auth-client";

const FONTS_LIST = [
  "DejaVu Sans Mono",
  "EB Garamond",
  "Fontin",
  "Gentium Book Plus",
  "Lato",
  "Libertinus Serif",
  "Mukta",
  "New Computer Modern",
  "Noto Sans",
  "Open Sans",
  "Open Sauce Sans",
  "Poppins",
  "Raleway",
  "Roboto",
  "Source Sans 3",
  "Ubuntu",
  "XCharter"
];

const TEMPLATES = [
  "classic",
  "engineeringclassic",
  "ember",
  "engineeringresumes",
  "harvard",
  "ink",
  "moderncv",
  "opal",
  "sb2nov",
];

const SOCIAL_NETWORKS_LIST = [
  "Instagram",
  "Bluesky",
  "GitHub",
  "GitLab",
  "Google Scholar",
  "IMBD",
  "Leetcode",
  "LinkedIn",
  "Mastodon",
  "ORCID",
  "Reddit",
  "ResearchGate",
  "StackOverflow",
  "Telegram",
  "WhatsApp",
  "X",
  "YouTube"
];

const DEFAULT_SPANISH_YAML = `cv:
  name: Sofía Valdés
  headline: Directora Creativa & Estratega de Marca
  location: Córdoba, Argentina
  email: sofia.valdes@gmail.com
  photo: 
  phone: "+541112345678"
  website: https://sofiavaldes.com
  social_networks:
    - network: LinkedIn
      username: sofiavaldes-creative
    - network: GitHub
      username: sofia-design
  custom_connections: []
  sections:
    Bienvenido a PalaTime:
      - PalaTime lee un CV estructurado en formato YAML y genera un PDF con tipografía profesional.
      - Cada título de sección es completamente personalizable.
      - Podés elegir entre múltiples tipos de entradas para cada bloque.
      - "Soporta sintaxis Markdown: esto es **negrita**, *cursiva* y [enlace](https://example.com)"
    Educacion:
      - institution: Universidad Nacional de Córdoba
        area: Diseño Industrial y Comunicación Visual
        degree: Licenciatura
        start_date: 2012-03
        end_date: 2016-12
        location: Córdoba, Argentina
        highlights:
          - 'Tesis: Impacto del diseño emocional en la identidad corporativa'
          - 'Premio Mejor Promoción Académica'
    Experiencia:
      - company: Estudio Lumina
        position: Directora de Arte Senior
        date:
        start_date: 2020-01
        end_date: present
        location: Córdoba, Argentina
        highlights:
          - Lideré equipos interdisciplinarios de diseño, estrategia y desarrollo para marcas internacionales.
          - Incrementé el engagement digital de los clientes clave en un 45% mediante campañas creativas integradas.
          - Gestioné presupuestos anuales superiores a u$s 500k con optimización de recursos.
      - company: Agencia Vértice
        position: Diseñadora Gráfica Senior
        date:
        start_date: 2017-02
        end_date: 2019-12
        location: Buenos Aires, Argentina
        highlights:
          - Diseñé identidades visuales completas para más de 25 PyMEs y startups tecnológicas.
    Proyectos:
      - name: Festival Disrupción
        date: 
        start_date: 2022-05
        end_date: present
        location: 
        summary: Encuentro anual de diseño, innovación y cultura digital en Latinoamérica.
        highlights:
          - Convocatoria de más de 3,000 asistentes presenciales y virtuales por edición.
    Publicaciones:
      - title: 'El poder del diseño sistémico en la era digital'
        authors:
          - '*Sofía Valdés*'
          - Martín Gómez
        journal: Revista Diseño & Estrategia
        date: 2023-10
        url: 
        summary: 
    Habilidades:
      - label: Dirección
        details: Gestión de equipos creativos, OKRs, Metodologías Ágiles, UX Strategy
      - label: Herramientas
        details: Figma, Adobe Creative Cloud, Notion, Miro, Jira
    Patentes:
      - number: Sistema Modular de Exhibición Comercial (Registro INPI Nº 112233)
      - number: Sistema Modular de Exhibición Comercial (Registro INPI Nº 112233)
      - number: Sistema Modular de Exhibición Comercial (Registro INPI Nº 112233)
    Charlas Invitadas:
      - reversed_number: El futuro del diseño en la estrategia de marca — Congreso Latam (2024)
      - reversed_number: El futuro del diseño en la estrategia de marca — Congreso LataM (2024)
      - reversed_number: El futuro del diseño en la estrategia de marca — Congreso Latam (2024)
design:
  theme: engineeringclassic
  typography:
    font_family: Source Sans 3
locale:
  language: spanish
settings:
  current_date: today
  pdf_title: CV_Sofia_Valdes
`;

const PYTHON_COMPILER_URL = process.env.NEXT_PUBLIC_PYTHON_COMPILER_URL || "http://127.0.0.1:8000/api/render";

const SECTION_MAP: Array<{ es: string; en: string }> = [
  { es: "perfil personal", en: "Summary" },
  { es: "perfil profesional", en: "Summary" },
  { es: "perfil", en: "Summary" },
  { es: "resumen", en: "Summary" },
  { es: "acerca de mi", en: "About Me" },
  { es: "sobre mi", en: "About Me" },
  { es: "experiencia laboral", en: "Work Experience" },
  { es: "experiencia profesional", en: "Profesional Experience" },
  { es: "experiencia", en: "Experience" },
  { es: "trayectoria profesional", en: "Profesional Experience" },
  { es: "historial laboral", en: "Work History" },
  { es: "educacion", en: "Education" },
  { es: "historial academico", en: "Education" },
  { es: "formacion academica", en: "Education" },
  { es: "formacion", en: "Education" },
  { es: "estudios", en: "Education" },
  { es: "proyectos personales", en: "Personal Projects" },
  { es: "proyectos destacados", en: "Featured Projects" },
  { es: "proyectos", en: "Projects" },
  { es: "obras realizadas", en: "Projects" },
  { es: "portafolio", en: "Portfolio" },
  { es: "habilidades tecnicas", en: "Skills" },
  { es: "habilidades", en: "Skills" },
  { es: "aptitudes", en: "Skills" },
  { es: "competencias", en: "Skills" },
  { es: "conocimientos", en: "Skills" },
  { es: "areas de especializacion", en: "Areas of Expertise" },
  { es: "cursos y especializaciones", en: "Courses & Specializations" },
  { es: "cursos", en: "Courses" },
  { es: "idiomas", en: "Languages" },
  { es: "certificaciones", en: "Certifications" },
  { es: "intereses", en: "Interests" },
  { es: "reconocimientos", en: "Awards" },
  { es: "logros", en: "Achievements" },
  { es: "charlas invitadas", en: "Invited Talks" },
  { es: "patentes", en: "Patents" },
  { es: "publicaciones", en: "Publications" },
  { es: "Bienvenido a PalaTime", en: "Welcome to PalaTime" },
];

function toCapitalTitle(str: string): string {
  const wordsToKeepLower = new Set(["de", "del", "y", "en", "para", "con", "a", "sobre", "por", "un", "una"]);
  const words = str.trim().toLowerCase().split(/\s+/);

  return words
    .map((word, index) => {
      if (index > 0 && wordsToKeepLower.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function translateSectionTitle(title: string, targetLang: "spanish" | "english"): string {
  const normalizedKey = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  for (const item of SECTION_MAP) {
    const normEs = item.es.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normEn = item.en.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (targetLang === "english") {
      if (normalizedKey === normEs) {
        return item.en;
      }
    } else {
      if (normalizedKey === normEn) {
        return toCapitalTitle(item.es);
      }
    }
  }

  return toCapitalTitle(title);
}

function inferCountryCode(locationStr: string): CountryCode | undefined {
  if (!locationStr) return undefined;
  const loc = locationStr.toLowerCase();
  if (loc.includes("colombia") || loc.includes("medellín") || loc.includes("bogotá")) return "CO";
  if (loc.includes("argentina") || loc.includes("buenos aires") || loc.includes("caba") || loc.includes("córdoba")) return "AR";
  if (loc.includes("españa") || loc.includes("spain") || loc.includes("madrid") || loc.includes("barcelona")) return "ES";
  if (loc.includes("méxico") || loc.includes("mexico") || loc.includes("cdmx")) return "MX";
  if (loc.includes("chile") || loc.includes("santiago")) return "CL";
  if (loc.includes("perú") || loc.includes("peru") || loc.includes("lima")) return "PE";
  if (loc.includes("uruguay") || loc.includes("montevideo")) return "UY";
  if (loc.includes("venezuela") || loc.includes("caracas")) return "VE";
  if (loc.includes("ecuador") || loc.includes("quito")) return "EC";
  if (loc.includes("usa") || loc.includes("united states") || loc.includes("estados unidos")) return "US";
  return undefined;
}

function validatePhoneDetailed(phoneStr: string, locationStr: string = ""): { isValid: boolean; formatted: string; message: string } {
  if (!phoneStr || phoneStr.trim() === "") {
    return { isValid: true, formatted: "", message: "" };
  }
  const countryCode = inferCountryCode(locationStr) || "AR";
  try {
    const phoneNumber = parsePhoneNumberFromString(phoneStr, countryCode);
    if (phoneNumber && phoneNumber.isValid() && phoneNumber.number === phoneStr.trim()) {
      return { isValid: true, formatted: phoneNumber.format("E.164"), message: "✓ Teléfono válido (Formato E.164)" };
    }
  } catch (e) {}

  return { isValid: false, formatted: phoneStr, message: "⚠️ Número incompleto o inválido (ej: +5411...)" };
}

function validateEmail(emailStr: string): { isValid: boolean; message: string } {
  if (!emailStr || emailStr.trim() === "") {
    return { isValid: true, message: "" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(emailStr.trim())) {
    return { isValid: true, message: "✓ Email válido" };
  }
  return { isValid: false, message: "⚠️ Formato de email inválido" };
}

function validateUrl(urlStr: string): { isValid: boolean; message: string } {
  if (!urlStr || urlStr.trim() === "") {
    return { isValid: true, message: "" };
  }
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { isValid: true, message: "✓ URL válida" };
    }
  } catch (e) {
    const domainRegex = /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/;
    if (domainRegex.test(urlStr.trim())) {
      return { isValid: true, message: "✓ Formato de web válido" };
    }
  }
  return { isValid: false, message: "⚠️ Formato de URL inválido" };
}

function validateDateString(dateStr: string, required: boolean = false, allowPresent: boolean = false): { isValid: boolean; message: string } {
  if (!dateStr || dateStr.trim() === "") {
    if (required) {
      return { isValid: false, message: "⚠️ Formato inválido (ej: 2026-01)" };
    }
    return { isValid: true, message: "" };
  }

  const cleanVal = dateStr.trim().toLowerCase();

  if (cleanVal === "present") {
    if (!allowPresent) {
      return { isValid: false, message: "⚠️ 'present' no está permitido en esta fecha" };
    }
    return { isValid: true, message: "✓ Fecha válida (present)" };
  }
  
  const regex = /^(\d{4})(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/;
  
  if (regex.test(cleanVal)) {
    return { isValid: true, message: "✓ Fecha válida (YYYY o YYYY-MM)" };
  }
  return { isValid: false, message: "⚠️ Formato inválido (ej: 2026-01)" };
}

export default function CrearCvPage() {
  return (
    <Suspense fallback={null}>
      <CrearCvContent />
    </Suspense>
  );
}

function CrearCvContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedFont, setSelectedFont] = useState<string>("Source Sans 3");
  const [modalSelectedFont, setModalSelectedFont] = useState<string>("Source Sans 3"); 

  const [yamlContent, setYamlContent] = useState<string>(DEFAULT_SPANISH_YAML);
  const [selectedTheme, setSelectedTheme] = useState<string>("engineeringclassic");
  const [viewMode, setViewMode] = useState<"yaml" | "form">("yaml");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<"spanish" | "english">("spanish");
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Estados para el Modal de Creación de CV
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newCvTitleInput, setNewCvTitleInput] = useState<string>("Nuevo CV");
  const [modalSelectedTheme, setModalSelectedTheme] = useState<string>("engineeringclassic");

  // Estado para el Modal de Invitado al intentar descargar
  const [showGuestDownloadModal, setShowGuestDownloadModal] = useState<boolean>(false);

  // Estados para el Menú de Opciones (3 puntitos) en el Aside y sus Modales de Renombrar / Eliminar (CVs Base)
  const [activeMenuCvId, setActiveMenuCvId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Estados para modales independientes de renombrar y eliminar CV Base
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [targetCv, setTargetCv] = useState<any | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>("");

  // Referencias para manejo de clics externos
  const menuRef = useRef<HTMLDivElement>(null);
  const adaptMenuRef = useRef<HTMLDivElement>(null);

  // Estados para el Tutorial Spotlight Interactivo
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const totalTutorialSteps = 8;

  const createBtnRef = useRef<HTMLButtonElement>(null);
  const importContainerRef = useRef<HTMLDivElement>(null);
  const adaptBtnRef = useRef<HTMLButtonElement>(null);
  const themeSelectRef = useRef<HTMLDivElement>(null);
  const fontSelectRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const formToggleRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const [spotlightRects, setSpotlightRects] = useState<DOMRect[]>([]);

  const [newSecTitle, setNewSecTitle] = useState("");
  const [newSecType, setNewSecType] = useState("Texto");

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showAdaptWarning, setShowAdaptWarning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBaseCvMissing, setIsBaseCvMissing] = useState(false);

  const [userCvs, setUserCvs] = useState<any[]>([]);
  const [activeCvId, setActiveCvId] = useState<string | null>(null);
  
  // Estados para la sección de Adaptaciones (con control de tipo activo y límite de 3)
  const [cvType, setCvType] = useState<"base" | "adapted">("base");
  const [userAdaptations, setUserAdaptations] = useState<any[]>([]);
  const [activeAdaptationId, setActiveAdaptationId] = useState<string | null>(null);
  const [activeMenuAdaptId, setActiveMenuAdaptId] = useState<string | null>(null);
  const [adaptMenuPosition, setAdaptMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showAdaptRenameModal, setShowAdaptRenameModal] = useState<boolean>(false);
  const [showAdaptDeleteModal, setShowAdaptDeleteModal] = useState<boolean>(false);
  const [targetAdapt, setTargetAdapt] = useState<any | null>(null);
  const [adaptRenameInputValue, setAdaptRenameInputValue] = useState<string>("");
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  // Estados para auto-guardado silencioso y control de cambios sin guardar
  const [lastSavedContent, setLastSavedContent] = useState<string>(DEFAULT_SPANISH_YAML);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);

  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session;

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0F172B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Efecto para cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuCvId(null);
      }
      if (adaptMenuRef.current && !adaptMenuRef.current.contains(event.target as Node)) {
        setActiveMenuAdaptId(null);
      }
    }
    if (activeMenuCvId || activeMenuAdaptId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuCvId, activeMenuAdaptId]);

  // Detectar cambios no guardados al cerrar la pestaña o recargar (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (yamlContent !== lastSavedContent) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [yamlContent, lastSavedContent]);

  // Auto-guardado silencioso inteligente (Distingue si se edita un CV Base o Adaptado)
  useEffect(() => {
    if (yamlContent === lastSavedContent) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        if (cvType === "base" && activeCvId) {
          if (isAuthenticated && !activeCvId.startsWith("local-cv-")) {
            await fetch(`/api/cvs/${activeCvId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ yamlContent }),
            });
          }
          const updated = userCvs.map(c => c.id === activeCvId ? { ...c, yamlContent } : c);
          setUserCvs(updated);
          if (!isAuthenticated || activeCvId.startsWith("local-cv-")) {
            localStorage.setItem("palatime_local_cvs", JSON.stringify(updated));
          }
        } else if (cvType === "adapted" && activeAdaptationId) {
          if (isAuthenticated && !activeAdaptationId.startsWith("local-adapt-")) {
            await fetch(`/api/adaptations/${activeAdaptationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ yamlContent }),
            });
          }
          const updated = userAdaptations.map(a => a.id === activeAdaptationId ? { ...a, yamlContent } : a);
          setUserAdaptations(updated);
          if (!isAuthenticated || activeAdaptationId.startsWith("local-adapt-")) {
            localStorage.setItem("palatime_local_adaptations", JSON.stringify(updated));
          }
        }
        setLastSavedContent(yamlContent);
      } catch (err) {
        console.error("Error en auto-guardado:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [yamlContent, lastSavedContent, activeCvId, activeAdaptationId, cvType, isAuthenticated, userCvs, userAdaptations]);

  // Lógica unificada para migración y carga inicial de CVs Base y Adaptados
  useEffect(() => {
    const initializeAndMigrateData = async () => {
      const seenTutorial = localStorage.getItem("palatime_tutorial_seen");
      if (!seenTutorial) {
        setShowTutorial(true);
        localStorage.setItem("palatime_tutorial_seen", "true");
      }

      const localCvsStr = localStorage.getItem("palatime_local_cvs");
      let localCvs = [];
      try {
        if (localCvsStr) localCvs = JSON.parse(localCvsStr);
      } catch (e) {}

      const localAdaptsStr = localStorage.getItem("palatime_local_adaptations");
      let localAdapts = [];
      try {
        if (localAdaptsStr) localAdapts = JSON.parse(localAdaptsStr);
      } catch (e) {}

      if (isAuthenticated) {
        try {
          // 1. Fetch CVs Base
          const resCvs = await fetch("/api/cvs");
          if (resCvs.ok) {
            const dataCvs = await resCvs.json();
            let dbCvs = dataCvs.cvs || [];

            const modifiedLocalCvs = Array.isArray(localCvs) ? localCvs.filter((cv: any) => {
              const isDefaultTitle = cv.title === "Nuevo CV" || cv.title === "Nuevo CV 1";
              const isDefaultContent = cv.yamlContent === DEFAULT_SPANISH_YAML;
              return !isDefaultTitle || !isDefaultContent;
            }) : [];

            for (const localCv of modifiedLocalCvs) {
              try {
                const createRes = await fetch("/api/cvs", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: localCv.title || "CV Migrado", yamlContent: localCv.yamlContent }),
                });
                if (createRes.ok) {
                  const createdData = await createRes.json();
                  if (createdData.cv) dbCvs.push(createdData.cv);
                }
              } catch (e) {}
            }
            localStorage.removeItem("palatime_local_cvs");

            if (dbCvs.length === 0) {
              const createRes = await fetch("/api/cvs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Nuevo CV", yamlContent: DEFAULT_SPANISH_YAML }),
              });
              if (createRes.ok) {
                const newData = await createRes.json();
                if (newData.cv) dbCvs = [newData.cv];
              }
            }

            setUserCvs(dbCvs);
            if (dbCvs.length > 0) {
              setCvType("base");
              setActiveCvId(dbCvs[0].id);
              setYamlContent(dbCvs[0].yamlContent);
              setLastSavedContent(dbCvs[0].yamlContent);
            }
          }

          // 2. Fetch Adaptaciones
          const resAdapts = await fetch("/api/adaptations");
          if (resAdapts.ok) {
            const dataAdapts = await resAdapts.json();
            setUserAdaptations(dataAdapts.adaptations || []);
          }

        } catch (err) {
          console.error("Error sincronizando con backend:", err);
        }
      } else {
        // Modo Invitado
        if (Array.isArray(localCvs) && localCvs.length > 0) {
          setUserCvs(localCvs);
          setCvType("base");
          setActiveCvId(localCvs[0].id);
          setYamlContent(localCvs[0].yamlContent);
          setLastSavedContent(localCvs[0].yamlContent);
        } else {
          const defaultLocalCv = {
            id: `local-cv-${crypto.randomUUID()}`,
            title: "Nuevo CV",
            yamlContent: DEFAULT_SPANISH_YAML,
          };
          setUserCvs([defaultLocalCv]);
          setCvType("base");
          setActiveCvId(defaultLocalCv.id);
          setYamlContent(defaultLocalCv.yamlContent);
          setLastSavedContent(defaultLocalCv.yamlContent);
          localStorage.setItem("palatime_local_cvs", JSON.stringify([defaultLocalCv]));
        }

        setUserAdaptations(localAdapts);
      }
    };

    initializeAndMigrateData();
  }, [isAuthenticated]);

  const executeWithUnsavedCheck = (action: () => void) => {
    if (yamlContent !== lastSavedContent) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  const loadCvIntoEditor = (cv: any) => {
    executeWithUnsavedCheck(() => {
      setCvType("base");
      setActiveCvId(cv.id);
      setActiveAdaptationId(null);
      setYamlContent(cv.yamlContent); 
      setLastSavedContent(cv.yamlContent);
    });
  };

  const loadAdaptationIntoEditor = (adapt: any) => {
    executeWithUnsavedCheck(() => {
      setCvType("adapted");
      setActiveAdaptationId(adapt.id);
      setActiveCvId(null);
      setYamlContent(adapt.yamlContent);
      setLastSavedContent(adapt.yamlContent);
    });
  };

  // Sincronizar selectores automáticamente al cambiar contenido
  useEffect(() => {
    if (parsedYamlObj?.design?.theme && TEMPLATES.includes(parsedYamlObj.design.theme)) {
      setSelectedTheme(parsedYamlObj.design.theme);
    }
    if (parsedYamlObj?.locale?.language) {
      setCurrentLang(parsedYamlObj.locale.language);
    }
    if (parsedYamlObj?.design?.typography?.font_family && FONTS_LIST.includes(parsedYamlObj.design.typography.font_family)) {
      setSelectedFont(parsedYamlObj.design.typography.font_family);
    }
  }, [yamlContent]);

  const handleConfirmCreateCv = async () => {
    try {
      let parsed = yaml.load(DEFAULT_SPANISH_YAML) as any;
      if (parsed) {
        parsed.design = parsed.design || {};
        parsed.design.theme = modalSelectedTheme;
        parsed.design.typography.font_family = modalSelectedFont;
      }
      const finalYaml = yaml.dump(parsed, { indent: 2, lineWidth: -1 });
      const title = newCvTitleInput || "Nuevo CV";

      if (isAuthenticated) {
        const res = await fetch("/api/cvs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, yamlContent: finalYaml }),
        });

        if (res.ok) {
          const data = await res.json();
          const listRes = await fetch("/api/cvs");
          if (listRes.ok) {
            const listData = await listRes.json();
            setUserCvs(listData.cvs);
          }
          if (data.cv) {
            setCvType("base");
            setActiveCvId(data.cv.id);
            setActiveAdaptationId(null);
            setYamlContent(data.cv.yamlContent);
            setLastSavedContent(data.cv.yamlContent);
            setSelectedTheme(modalSelectedTheme);
            setSelectedFont(modalSelectedFont);
          }
          setShowCreateModal(false);
        } else {
          alert("Error al guardar el nuevo CV");
        }
      } else {
        const newLocalCv = {
          id: `local-cv-${crypto.randomUUID()}`,
          title,
          yamlContent: finalYaml,
        };
        const updated = [...userCvs, newLocalCv];
        setUserCvs(updated);
        setCvType("base");
        setActiveCvId(newLocalCv.id);
        setActiveAdaptationId(null);
        setYamlContent(newLocalCv.yamlContent);
        setLastSavedContent(newLocalCv.yamlContent);
        setSelectedTheme(modalSelectedTheme);
        setSelectedFont(modalSelectedFont);
        localStorage.setItem("palatime_local_cvs", JSON.stringify(updated));
        setShowCreateModal(false);
      }
    } catch (e) {
      alert("Error procesando la plantilla.");
    }
  };

  const handleConfirmRename = async () => {
    if (!targetCv || !renameInputValue.trim()) return;
    const id = targetCv.id;

    if (isAuthenticated && !id.startsWith("local-cv-")) {
      try {
        await fetch(`/api/cvs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: renameInputValue }),
        });
      } catch (e) {}
    }

    const updated = userCvs.map(c => c.id === id ? { ...c, title: renameInputValue } : c);
    setUserCvs(updated);
    if (!isAuthenticated || id.startsWith("local-cv-")) {
      localStorage.setItem("palatime_local_cvs", JSON.stringify(updated));
    }
    setShowRenameModal(false);
    setTargetCv(null);
  };

  const handleConfirmDelete = async () => {
    if (!targetCv) return;
    const id = targetCv.id;

    if (isAuthenticated && !id.startsWith("local-cv-")) {
      try {
        await fetch(`/api/cvs/${id}`, { method: "DELETE" });
      } catch (e) {}
    }

    const updated = userCvs.filter(c => c.id !== id);
    setUserCvs(updated);
    if (!isAuthenticated || id.startsWith("local-cv-")) {
      localStorage.setItem("palatime_local_cvs", JSON.stringify(updated));
    }
    setShowDeleteModal(false);
    setTargetCv(null);

    if (activeCvId === id && updated.length > 0) {
      loadCvIntoEditor(updated[0]);
    }
  };

  // Funciones específicas para gestionar Adaptaciones en el Aside
  const handleConfirmAdaptRename = async () => {
    if (!targetAdapt || !adaptRenameInputValue.trim()) return;
    const id = targetAdapt.id;

    if (isAuthenticated && !id.startsWith("local-adapt-")) {
      try {
        await fetch(`/api/adaptations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle: adaptRenameInputValue }),
        });
      } catch (e) {}
    }

    const updated = userAdaptations.map(a => a.id === id ? { ...a, jobTitle: adaptRenameInputValue, title: adaptRenameInputValue } : a);
    setUserAdaptations(updated);
    if (!isAuthenticated || id.startsWith("local-adapt-")) {
      localStorage.setItem("palatime_local_adaptations", JSON.stringify(updated));
    }
    setShowAdaptRenameModal(false);
    setTargetAdapt(null);
  };

  const handleConfirmAdaptDelete = async () => {
    if (!targetAdapt) return;
    const id = targetAdapt.id;

    if (isAuthenticated && !id.startsWith("local-adapt-")) {
      try {
        await fetch(`/api/adaptations/${id}`, { method: "DELETE" });
      } catch (e) {}
    }

    const updated = userAdaptations.filter(a => a.id !== id);
    setUserAdaptations(updated);
    if (!isAuthenticated || id.startsWith("local-adapt-")) {
      localStorage.setItem("palatime_local_adaptations", JSON.stringify(updated));
    }
    setShowAdaptDeleteModal(false);
    setTargetAdapt(null);

    if (activeAdaptationId === id && updated.length > 0) {
      loadAdaptationIntoEditor(updated[0]);
    }
  };

  const [isClientReady, setIsClientReady] = useState(false);
  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const authSectionRef = useRef<HTMLDivElement>(null);
  const [shouldHighlightAuth, setShouldHighlightAuth] = useState(false);

  const triggerAuthAttention = () => {
    authSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    setShouldHighlightAuth(true);
    setTimeout(() => setShouldHighlightAuth(false), 2000);
  };

  const handleProtectedImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      e.target.value = "";
      triggerAuthAttention();
      return;
    }
    handleFileUpload(e);
  };

  const handleProtectedAdaptWithLimit = () => {
    if (!isAuthenticated) {
      triggerAuthAttention();
      return;
    }
    if (userAdaptations.length >= 3) {
      setShowLimitModal(true);
      return;
    }
    handleAdaptClick();
  };

  useEffect(() => {
    setIsMounted(true);
    // @ts-ignore
    setIsBaseCvMissing(!hasBaseCv());
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("palatime_dark_mode");
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === "true");
    }
  }, []);

  useEffect(() => {
    if (!showTutorial) return;
    const updateRects = () => {
      let targets: HTMLElement[] = [];
      if (tutorialStep === 1) {
        if (createBtnRef.current) targets.push(createBtnRef.current);
        if (importContainerRef.current) targets.push(importContainerRef.current);
      } else if (tutorialStep === 2) {
        if (adaptBtnRef.current) targets.push(adaptBtnRef.current);
      } else if (tutorialStep === 3) {
        if (editorRef.current) targets.push(editorRef.current);
      } else if (tutorialStep === 4) {
        if (themeSelectRef.current) targets.push(themeSelectRef.current);
      } else if (tutorialStep === 5) {
        if (fontSelectRef.current) targets.push(fontSelectRef.current);
      } else if (tutorialStep === 6) {
        if (formToggleRef.current) targets.push(formToggleRef.current);
      } else if (tutorialStep === 7) {
        if (previewRef.current) targets.push(previewRef.current);
      } else if (tutorialStep === 8) {
        if (downloadRef.current) targets.push(downloadRef.current);
      }

      if (targets.length > 0) {
        setSpotlightRects(targets.map(el => el.getBoundingClientRect()));
      }
    };

    updateRects();
    window.addEventListener("resize", updateRects);
    return () => window.removeEventListener("resize", updateRects);
  }, [showTutorial, tutorialStep, viewMode]);

  const handleEditorWillMount = (monaco: typeof import("monaco-editor")) => {
    monaco.editor.defineTheme("navy-minimal", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "DDE3F0", background: "0F172B" },
        { token: "key", foreground: "9BB8E0" },        
        { token: "string", foreground: "AFCBFF" },    
        { token: "number", foreground: "C7D5ED" },
        { token: "keyword", foreground: "AFCBFF" },
        { token: "comment", foreground: "5C6370" },
      ],
      colors: {
        "editor.background": "#0F172B",
        "editor.foreground": "#DDE3F0",
        "editorLineNumber.foreground": "#4F6FA5",
        "editorCursor.foreground": "#FFFFFF",
        "editor.selectionBackground": "#1E3A6F",
      },
    });
  };

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("palatime_dark_mode", String(nextMode));
  };

  const compilePdf = useCallback(async (content: string, theme: string) => {
    if (!content.trim()) return;
    setIsCompiling(true);
    setCompileError(null);

    try {
      let finalContent = content;
      try {
        const parsed: any = yaml.load(content);
        if (parsed) {
          parsed.design = parsed.design || {};
          parsed.design.theme = theme;
          finalContent = yaml.dump(parsed, { indent: 2, lineWidth: -1 });
        }
      } catch (e) {}

      const res = await fetch(PYTHON_COMPILER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml_content: finalContent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al compilar en PalaTime");
      }

      const blob = await res.blob();
      const newPdfUrl = URL.createObjectURL(blob);

      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return newPdfUrl;
      });
    } catch (err: any) {
      console.error(err);
      setCompileError(err.message || "Asegúrate de que Docker esté corriendo en el puerto 8000.");
    } finally {
      setIsCompiling(false);
    }
  }, []);

  const performPreCompilationValidation = (content: string): boolean => {
    setValidationWarning(null);
    try {
      const parsed = yaml.load(content) as any;
      if (!parsed || !parsed.cv) return true;

      const cv = parsed.cv;

      if (cv.phone !== undefined && cv.phone !== null && String(cv.phone).trim() !== "") {
        const pCheck = validatePhoneDetailed(String(cv.phone), cv.location || "");
        if (!pCheck.isValid) {
          setValidationWarning(`⚠️ Teléfono inválido (phone: "${cv.phone}"). Use formato de teléfono válido.`);
          return false;
        }
      }

      if (cv.email !== undefined && cv.email !== null && String(cv.email).trim() !== "") {
        const eCheck = validateEmail(String(cv.email));
        if (!eCheck.isValid) {
          setValidationWarning(`⚠️ Email inválido (email: "${cv.email}"). Use formato nombre@dominio.com.`);
          return false;
        }
      }

      if (cv.website !== undefined && cv.website !== null && String(cv.website).trim() !== "") {
        const wCheck = validateUrl(String(cv.website));
        if (!wCheck.isValid) {
          setValidationWarning(`⚠️ Sitio web inválido (website: "${cv.website}"). Use formato URL válido.`);
          return false;
        }
      }

      if (cv.photo !== undefined && cv.photo !== null && String(cv.photo).trim() !== "") {
        const photoCheck = validateUrl(String(cv.photo));
        if (!photoCheck.isValid) {
          setValidationWarning(`⚠️ Foto URL inválida (photo: "${cv.photo}"). Use formato URL válido.`);
          return false;
        }
      }

      if (cv.sections && typeof cv.sections === "object") {
        for (const [secTitle, items] of Object.entries(cv.sections)) {
          if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item && typeof item === "object") {
                if (item.date !== undefined && item.date !== null && String(item.date).trim() !== "") {
                  const dCheck = validateDateString(String(item.date), false);
                  if (!dCheck.isValid) {
                    setValidationWarning(`⚠️ Fecha inválida en sección "${secTitle}" (item #${i + 1}, date: "${item.date}"). Use YYYY o YYYY-MM.`);
                    return false;
                  }
                }
                if (item.start_date !== undefined) {
                  const sdCheck = validateDateString(item.start_date ? String(item.start_date) : "", true, false);
                  if (!sdCheck.isValid) {
                    setValidationWarning(`⚠️ Fecha de inicio inválida en sección "${secTitle}" (item #${i + 1}, start_date: "${item.start_date ?? ""}"). Use YYYY o YYYY-MM.`);
                    return false;
                  }
                }
                if (item.end_date !== undefined) {
                  const edCheck = validateDateString(item.end_date ? String(item.end_date) : "", true, true);
                  if (!edCheck.isValid) {
                    setValidationWarning(`⚠️ Fecha de fin inválida en sección "${secTitle}" (item #${i + 1}, end_date: "${item.end_date ?? ""}"). Use YYYY, YYYY-MM o present.`);
                    return false;
                  }
                }
                if (item.url !== undefined && item.url !== null && String(item.url).trim() !== "") {
                  const uCheck = validateUrl(String(item.url));
                  if (!uCheck.isValid) {
                    setValidationWarning(`⚠️ Sitio web inválido (website: "${item.url}"). Use formato URL válido.`);
                    return false;
                  }
                }
              }
            }
          }
        }
      }

    } catch (e) {}
    return true;
  };

  useEffect(() => {
    if (!performPreCompilationValidation(yamlContent)) {
      return;
    }
    const timer = setTimeout(() => {
      compilePdf(yamlContent, selectedTheme);
    }, 600);
    return () => clearTimeout(timer);
  }, [yamlContent, selectedTheme, compilePdf]);

  const handleThemeChange = (newTheme: string) => {
    setSelectedTheme(newTheme);
    try {
      const parsed: any = yaml.load(yamlContent);
      if (parsed) {
        parsed.design = parsed.design || {};
        parsed.design.theme = newTheme;
        setYamlContent(yaml.dump(parsed, { indent: 2, lineWidth: -1 }));
      }
    } catch (e) {}
  };

  const handleFontChange = (newFont: string) => {
    setSelectedFont(newFont);
    try {
      const parsed: any = yaml.load(yamlContent);
      if (parsed) {
        parsed.design = parsed.design || {};
        parsed.design.typography = parsed.design.typography || {};
        parsed.design.typography.font_family = newFont;
        setYamlContent(yaml.dump(parsed, { indent: 2, lineWidth: -1 }));
      }
    } catch (e) {}
  };

  const toggleLanguage = (targetLang: "spanish" | "english") => {
    try {
      const parsed: any = yaml.load(yamlContent);
      if (!parsed || !parsed.cv || !parsed.cv.sections) return;

      parsed.locale = { language: targetLang };
      const oldSections = parsed.cv.sections;
      const newSections: Record<string, any> = {};

      Object.keys(oldSections).forEach((key) => {
        const translatedKey = translateSectionTitle(key, targetLang);
        newSections[translatedKey] = oldSections[key];
      });

      parsed.cv.sections = newSections;
      setYamlContent(yaml.dump(parsed, { indent: 2, lineWidth: -1 }));
      setCurrentLang(targetLang);
    } catch (e) {
      console.error("Error cambiando idioma:", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "No se pudo procesar el archivo");
      }

      const data = await res.json();
      if (data.yaml) {
        setYamlContent(data.yaml);
        setCurrentLang("spanish");
      }
    } catch (err: any) {
      alert("Error al importar: " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  let parsedYamlObj: any = {};
  try {
    parsedYamlObj = yaml.load(yamlContent) || {};
  } catch (e) {}

  const updateYamlData = (updater: (obj: any) => void) => {
    try {
      const copy = JSON.parse(JSON.stringify(parsedYamlObj));
      updater(copy);
      setYamlContent(yaml.dump(copy, { indent: 2, lineWidth: -1 }));
    } catch (e) {}
  };

  const handleAddEntryToSection = (secTitle: string, entryType: string) => {
    updateYamlData((o) => {
      o.cv.sections[secTitle] = o.cv.sections[secTitle] || [];
      let newItem: any = "";
      if (entryType === "Experiencia") {
        newItem = { company: "", position: "", date: null, start_date: "2026-01", end_date: "present", location: null, highlights: [] };
      } else if (entryType === "Educación") {
        newItem = { institution: "", area: "", degree: "", start_date: "2026-01", end_date: "2026-01", location: null, highlights: [] };
      } else if (entryType === "Publicación") {
        newItem = { title: "", authors: [], journal: "", date: "2026-01", url: null, summary: "" };
      } else if (entryType === "Proyecto Normal") {
        newItem = { name: "", date: null, start_date: "2026-01", end_date: "present", location: null, summary: "", highlights: [] };
      } else if (entryType === "En Línea") {
        newItem = { label: "", details: "" };
      } else if (entryType === "Viñeta") {
        newItem = { bullet: "Nueva viñeta" };
      } else if (entryType === "Numerada") {
        newItem = { number: "Elemento numerado" };
      } else if (entryType === "Numerada Inversa") {
        newItem = { reversed_number: "Elemento inverso" };
      } else {
        newItem = "Nuevo texto descriptivo";
      }
      o.cv.sections[secTitle].push(newItem);
    });
  };

  const handleAddNewSection = () => {
    if (!newSecTitle.trim()) return;
    updateYamlData((o) => {
      o.cv.sections = o.cv.sections || {};
      let initialVal: any = ["Texto de ejemplo"];
      if (newSecType === "Experiencia") {
        initialVal = [{ company: "", position: "", date: null, start_date: "2026-01", end_date: "present", location: null, highlights: [] }];
      } else if (newSecType === "Educación") {
        initialVal = [{ institution: "", area: "", degree: "", date: null, start_date: "2026-01", end_date: "2026-01", location: null, highlights: [] }];
      } else if (newSecType === "Publicación") {
        initialVal = [{ title: "", authors: [], journal: "", date: "2026-01", url: null, summary: "" }];
      } else if (newSecType === "Proyecto Normal") {
        initialVal = [{ name: "", date: null, start_date: "2026-01", end_date: "present", location: null, summary: "", highlights: [] }];
      } else if (newSecType === "En Línea") {
        initialVal = [{ label: "", details: "" }];
      } else if (newSecType === "Viñeta") {
        initialVal = [{ bullet: "Viñeta" }];
      } else if (newSecType === "Numerada") {
        initialVal = [{ number: "Elemento" }];
      } else if (newSecType === "Numerada Inversa") {
        initialVal = [{ reversed_number: "Elemento inverso" }];
      }
      o.cv.sections[newSecTitle.trim()] = initialVal;
    });
    setNewSecTitle("");
  };

  const phoneInfo = validatePhoneDetailed(parsedYamlObj?.cv?.phone || "", parsedYamlObj?.cv?.location || "");
  const emailInfo = validateEmail(parsedYamlObj?.cv?.email || "");
  const websiteInfo = validateUrl(parsedYamlObj?.cv?.website || "");
  const photoInfo = validateUrl(parsedYamlObj?.cv?.photo || "");

  const getModalPositionStyle = () => {
    if (spotlightRects.length === 0) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const firstRect = spotlightRects[0];
    
    if (tutorialStep === 1 || tutorialStep === 2) {
      return {
        position: "fixed" as const,
        top: `${Math.max(20, firstRect.top)}px`,
        left: `${firstRect.right + 24}px`,
      };
    }
    if (tutorialStep === 3) {
      return {
        position: "fixed" as const,
        top: `${Math.max(80, firstRect.top + 40)}px`,
        left: `${firstRect.right + 24}px`,
      };
    }
    if (tutorialStep === 4) {
      return {
        position: "fixed" as const,
        top: `${firstRect.bottom + 16}px`,
        left: `${Math.max(20, firstRect.left)}px`,
      };
    }
    if (tutorialStep === 5) {
      return {
        position: "fixed" as const,
        top: `${firstRect.bottom + 16}px`,
        left: `${Math.max(20, firstRect.left)}px`,
      };
    }
    return {
      position: "fixed" as const,
      top: `${Math.max(80, firstRect.top)}px`,
      right: `${window.innerWidth - firstRect.left + 24}px`,
    };
  };

  const handleAdaptClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // @ts-ignore
    if (!hasBaseCv()) {
      setShowAdaptWarning(true);
    } else {
      router.push("/adaptar");
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${isDarkMode ? "bg-[#090D16] text-[#F8FAFC]" : "bg-[#F1F5F9] text-[#0F172A]"}`}>
      
      {/* 1. BARRA LATERAL IZQUIERDA */}
      <aside className={`w-72 flex flex-col border-r shrink-0 justify-between p-4 select-none ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-white border-neutral-200"}`}>
        <div className="space-y-6 pr-1">
          <div className="flex items-center justify-between px-2">
            <div onClick={() => executeWithUnsavedCheck(() => router.push("/home"))} className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-md">P</div>
              <span className="font-bold text-base tracking-tight">PalaTime Studio</span>
            </div>
            
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-lg border transition ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/10 text-amber-400 hover:bg-[#25364f]" : "bg-neutral-100 border-neutral-300 text-slate-700 hover:bg-neutral-200"}`}
              title="Cambiar Modo Oscuro / Claro"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-2">
            <button 
              ref={createBtnRef}
              onClick={() => {
                executeWithUnsavedCheck(() => {
                  setNewCvTitleInput("Nuevo CV");
                  setModalSelectedTheme("engineeringclassic");
                  setModalSelectedFont("Source Sans 3");
                  setShowCreateModal(true);
                });
              }} 
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition ${showTutorial && tutorialStep === 1 ? "relative z-50 ring-4 ring-blue-500 shadow-2xl" : ""}`}
            >
              <Plus className="w-4 h-4" />
              Crear nuevo CV
            </button>

            {/* Botón Importar protegido */}
            <div 
              ref={importContainerRef}
              className={`w-full rounded-xl transition ${showTutorial && tutorialStep === 1 ? "relative z-50 ring-4 ring-blue-500 shadow-2xl" : ""}`}
            >
              <label 
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    triggerAuthAttention();
                  }
                }}
                className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3 cursor-pointer transition text-center ${isDarkMode ? "border-white/20 hover:border-blue-500 bg-[#1D293D]/30" : "border-neutral-300 hover:border-blue-500 bg-neutral-50"}`}
              >
                <Upload className="w-4 h-4 mb-1 text-blue-500" />
                <span className="text-xs font-medium">Importá tu PDF / Word</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleProtectedImport} disabled={isParsing} className="hidden" />
              </label>
            </div>

            {/* Botón Adaptar protegido con validación de límite de 3 */}
            <button 
              ref={adaptBtnRef}
              onClick={handleProtectedAdaptWithLimit}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition shadow-sm ${showTutorial && tutorialStep === 2 ? "relative z-50 ring-4 ring-blue-500 shadow-2xl bg-[#1D293D]" : ""} ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/10 hover:bg-[#25364f]" : "bg-white border-neutral-300 hover:bg-neutral-50"}`}
            >
              <FileUser className="w-4 h-4 text-blue-500" />
              Adaptar CV
            </button>
          </div>

          {/* Sección de CVs Base */}
          <div className="py-1">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-65">Mis CVs</span>
              {!isAuthenticated && <span className="text-[10px] text-amber-400 font-medium flex items-center"><CloudOff size={13} className="mx-1"/>Local</span>}
            </div>
            
            <div className="space-y-1 max-h-[135px] overflow-y-auto overflow-x-visible pr-1 relative">
              {userCvs.map((cv) => (
                <div 
                  key={cv.id} 
                  className={`group relative px-2 py-1 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                    activeCvId === cv.id 
                      ? (isDarkMode ? "bg-[#1D293D] text-white border border-blue-500/30" : "bg-blue-50 text-blue-900 border border-blue-200")
                      : (isDarkMode ? "hover:bg-neutral-800/50 text-neutral-300" : "hover:bg-neutral-100 text-neutral-700")
                  }`}
                >
                  <div className="flex-1 truncate mr-2" onClick={() => loadCvIntoEditor(cv)}>
                    <span className="truncate block">{cv.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 relative">
                    {activeCvId === cv.id && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeMenuCvId === cv.id) {
                          setActiveMenuCvId(null);
                          setMenuPosition(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPosition({ top: rect.top, left: rect.right + 8 });
                          setActiveMenuCvId(cv.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition relative"
                    >
                      <MoreVertical className="w-3.5 h-3.5 opacity-70" />
                    </button>

                    {activeMenuCvId === cv.id && menuPosition && (
                      <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={(e) => { e.stopPropagation(); setActiveMenuCvId(null); setMenuPosition(null); }} />
                        <div 
                          ref={menuRef} 
                          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
                          className={`fixed w-32 px-1 rounded-xl shadow-2xl border z-50 py-1 text-xs ${isDarkMode ? "bg-[#1D293D] border-white/20 text-white" : "bg-white border-neutral-200 text-neutral-800"}`}
                        >
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetCv(cv);
                              setRenameInputValue(cv.title);
                              setShowRenameModal(true);
                              setActiveMenuCvId(null);
                              setMenuPosition(null);
                            }}
                            className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-blue-500/20 rounded-md cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Renombrar
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetCv(cv);
                              setShowDeleteModal(true);
                              setActiveMenuCvId(null);
                              setMenuPosition(null);
                            }}
                            className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-red-400 hover:bg-red-500/20 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN NUEVA: CVs Adaptados (Con límite estricto de 3 y estado vacío) */}
          <div className="space-y-2 pt-2 border-t border-neutral-700/20">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-65">CVs Adaptados ({userAdaptations.length}/3)</span>
            </div>

            {userAdaptations.length === 0 ? (
              <div className={`p-3 rounded-xl border border-dashed text-center space-y-1.5 ${isDarkMode ? "border-white/10 text-neutral-400 bg-neutral-900/30" : "border-neutral-300 text-neutral-500 bg-neutral-50"}`}>
                <p className="text-[11px] font-medium">No tenés adaptaciones guardadas</p>
                <button 
                  onClick={handleProtectedAdaptWithLimit}
                  className="text-[10px] text-blue-400 hover:underline font-semibold flex items-center justify-center gap-1 mx-auto"
                >
                  <Sparkles className="w-3 h-3" /> Crear adaptación IA
                </button>
              </div>
            ) : (
              <div className="space-y-1 max-h-[100px] overflow-y-auto overflow-x-visible pr-1 relative">
                {userAdaptations.map((adapt) => (
                  <div 
                    key={adapt.id} 
                    className={`group relative px-2 py-1 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                      activeAdaptationId === adapt.id 
                        ? (isDarkMode ? "bg-[#1D293D] text-white border border-blue-500/30" : "bg-blue-50 text-blue-900 border border-blue-200")
                        : (isDarkMode ? "hover:bg-neutral-800/50 text-neutral-300" : "hover:bg-neutral-100 text-neutral-700")
                    }`}
                  >
                    <div className="flex-1 truncate mr-2" onClick={() => loadAdaptationIntoEditor(adapt)}>
                      <span className="truncate block font-semibold">
                        {adapt.jobTitle || adapt.title || "CV Adaptado"} {adapt.company ? `- ${adapt.company}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 relative">
                      {activeAdaptationId === adapt.id && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeMenuAdaptId === adapt.id) {
                            setActiveMenuAdaptId(null);
                            setAdaptMenuPosition(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setAdaptMenuPosition({ top: rect.top, left: rect.right + 8 });
                            setActiveMenuAdaptId(adapt.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition relative"
                      >
                        <MoreVertical className="w-3.5 h-3.5 opacity-70" />
                      </button>

                      {activeMenuAdaptId === adapt.id && adaptMenuPosition && (
                        <>
                          <div className="fixed inset-0 z-40 bg-transparent" onClick={(e) => { e.stopPropagation(); setActiveMenuAdaptId(null); setAdaptMenuPosition(null); }} />
                          <div 
                            ref={adaptMenuRef} 
                            style={{ top: `${adaptMenuPosition.top}px`, left: `${adaptMenuPosition.left}px` }}
                            className={`fixed w-32 px-1 rounded-xl shadow-2xl border z-50 py-1 text-xs ${isDarkMode ? "bg-[#1D293D] border-white/20 text-white" : "bg-white border-neutral-200 text-neutral-800"}`}
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetAdapt(adapt);
                                setAdaptRenameInputValue(adapt.jobTitle || adapt.title || "");
                                setShowAdaptRenameModal(true);
                                setActiveMenuAdaptId(null);
                                setAdaptMenuPosition(null);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-blue-500/20 rounded-md cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Renombrar
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetAdapt(adapt);
                                setShowAdaptDeleteModal(true);
                                setActiveMenuAdaptId(null);
                                setAdaptMenuPosition(null);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-red-400 hover:bg-red-500/20 rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 border-t border-neutral-700/20">
          <div className="py-2 -mb-2 text-xs font-medium">
            <button 
              onClick={() => { setTutorialStep(1); setShowTutorial(true); }}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-neutral-500/10 text-left"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Tutorial
            </button>
          </div>

          <div 
            ref={authSectionRef}
            className={`pt-2 ${!isAuthenticated ? 'border' : 'border-0' } border-neutral-700/20 transition-all duration-500 rounded-2xl p-2 ${
              shouldHighlightAuth ? "ring-4 ring-blue-500 bg-blue-500/10" : ""
            }`}
          >
            {!isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-[11px] opacity-70 text-center">Iniciá sesión para sincronizar con la nube.</p>
                <button
                  onClick={async () => {
                    await authClient.signIn.social({
                      provider: "google",
                      callbackURL: "/",
                    });
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-900 border font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.22 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.4l4.09-3.16z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.99 6.73-4.99z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </div>
            ) : (
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDarkMode ? "bg-[#1D293D]/60 border-[#F8FAFC]/10" : "bg-neutral-100 border-neutral-200"}`}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center text-white font-bold text-xs justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{session.user.name}</p>
                    <p className="text-[10px] opacity-60 truncate">{session.user.email}</p>
                  </div>
                </div>
                <button onClick={async () => { await authClient.signOut(); router.refresh(); }} title="Cerrar sesión" className="text-red-400 hover:text-red-300 p-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-white border-neutral-200"}`}>
          <div className="flex items-center gap-4">
            <div 
              ref={themeSelectRef}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${showTutorial && tutorialStep === 4 ? "relative z-50 ring-4 ring-blue-500 bg-[#0F172B] shadow-2xl" : ""} ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-[#F8FAFC]" : "bg-neutral-100 border-neutral-300 text-slate-800"}`}
            >
              <span className="opacity-70 font-medium">Plantilla:</span>
              <select
                value={selectedTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="bg-transparent font-semibold outline-none cursor-pointer"
              >
                {TEMPLATES.map((t) => (
                  <option key={t} value={t} className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div ref={fontSelectRef} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${showTutorial && tutorialStep === 5 ? "relative z-50 ring-4 ring-blue-500 bg-[#0F172B] shadow-2xl" : ""} ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-[#F8FAFC]" : "bg-neutral-100 border-neutral-300 text-slate-800"}`}>
              <span className="opacity-70 font-medium">Fuente:</span>
              <select
                value={selectedFont}
                onChange={(e) => handleFontChange(e.target.value)}
                className="bg-transparent font-semibold outline-none cursor-pointer max-w-[130px] truncate"
              >
                {FONTS_LIST.map((font) => (
                  <option key={font} value={font} className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div 
              ref={formToggleRef}
              className={`flex p-1 rounded-lg border text-xs transition-all ${showTutorial && tutorialStep === 6 ? "relative z-50 ring-4 ring-blue-500 bg-[#0F172B] shadow-2xl" : ""} ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/20" : "bg-neutral-100 border-neutral-300"}`}
            >
              <button
                onClick={() => setViewMode("yaml")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${viewMode === "yaml" ? "bg-blue-600 text-white" : "opacity-70"}`}
              >
                Código YAML
              </button>
              <button
                onClick={() => setViewMode("form")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${viewMode === "form" ? "bg-blue-600 text-white" : "opacity-70"}`}
              >
                Formulario
              </button>
            </div>

            {isSaving && (
              <span className="text-xs text-amber-400 font-medium animate-pulse">
                Guardando cambios...
              </span>
            )}
            {isCompiling && (
              <span className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 animate-pulse font-medium">
              Compilando PDF...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center rounded-lg p-1 border text-xs ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20" : "bg-neutral-100 border-neutral-300"}`}>
              <button
                onClick={() => toggleLanguage("spanish")}
                className={`px-3 py-1 rounded transition-colors font-medium ${currentLang === "spanish" ? "bg-blue-600 text-white" : "opacity-70 hover:opacity-100"}`}
              >
                Español
              </button>
              <button
                onClick={() => toggleLanguage("english")}
                className={`px-3 py-1 rounded transition-colors font-medium flex items-center gap-1 ${currentLang === "english" ? "bg-blue-600 text-white" : "opacity-70 hover:opacity-100"}`}
              >
                English
              </button>
            </div>
          </div>
        </header>

        {validationWarning && (
          <div className="bg-amber-500 text-neutral-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0">
            <span>{validationWarning}</span>
            <button onClick={() => setValidationWarning(null)} className="font-bold px-2">✕</button>
          </div>
        )}

        {/* ÁREA PRINCIPAL: Validación si hay CVs creados o no */}
        {userCvs.length === 0 ? (
          /* ESTADO VACÍO EN EDITOR / SKELETON LOADER EN PREVIEW */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            
            {/* Columna Izquierda: Mensaje de que no hay CVs */}
            <div className={`flex flex-col items-center justify-center p-8 text-center select-none border-r ${isDarkMode ? "bg-[#090D16] border-[#F8FAFC]/10 text-[#F8FAFC]" : "bg-[#F1F5F9] border-neutral-200 text-[#0F172A]"}`}>
              <div className={`max-w-md p-8 rounded-2xl border shadow-2xl space-y-4 ${isDarkMode ? "bg-[#0F172B] border-white/10" : "bg-white border-neutral-200"}`}>
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center mx-auto mb-2">
                  <FileUser className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">No tenés ningún CV creado</h3>
                <p className="text-xs opacity-70 leading-relaxed">
                  Actualmente no hay currículums disponibles en tu espacio de trabajo. Creá uno nuevo para comenzar a editar su contenido, cambiar plantillas y exportarlo en PDF.
                </p>
                <button
                  onClick={() => {
                    setNewCvTitleInput("Nuevo CV");
                    setModalSelectedTheme("engineeringclassic");
                    setShowCreateModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Crear un nuevo CV ahora
                </button>
              </div>
            </div>

            {/* Columna Derecha: Animación visual de carga (Skeleton Loader basada en la imagen) */}
            <div className={`flex flex-col h-full items-center justify-center p-8 overflow-hidden animate-pulse ${isDarkMode ? "bg-[#090D16]" : "bg-neutral-100"}`}>
              <div className={`w-full max-w-md h-[100%] rounded-2xl border p-6 flex flex-col items-center space-y-6 shadow-2xl ${isDarkMode ? "bg-[#0F172B]/60 border-white/10" : "bg-white border-neutral-200"}`}>
                {/* Cabecera simulada */}
                <div className="w-32 h-6 bg-blue-500/20 rounded-full mb-2"></div>
                <div className="w-48 h-3 bg-blue-500/10 rounded-full mb-6"></div>
                
                {/* Líneas de contenido simuladas */}
                <div className="w-full space-y-3">
                  <div className="w-24 h-4 bg-blue-500/20 rounded mb-2"></div>
                  <div className="w-full h-2.5 bg-blue-500/10 rounded"></div>
                  <div className="w-full h-2.5 bg-blue-500/10 rounded"></div>
                  <div className="w-5/6 h-2.5 bg-blue-500/10 rounded"></div>
                </div>

                <div className="w-full space-y-3 pt-4">
                  <div className="w-28 h-4 bg-blue-500/20 rounded mb-2"></div>
                  <div className="w-full h-2.5 bg-blue-500/10 rounded"></div>
                  <div className="w-full h-2.5 bg-blue-500/10 rounded"></div>
                </div>

                <div className="w-full space-y-3 pt-4">
                  <div className="w-20 h-4 bg-blue-500/20 rounded mb-2"></div>
                  <div className="w-full h-2.5 bg-blue-500/10 rounded"></div>
                  <div className="w-4/5 h-2.5 bg-blue-500/10 rounded"></div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* VISTA NORMAL DE EDITOR Y PREVIEW (CUANDO SÍ HAY CVs) */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            
            {/* Columna Izquierda: Editor / Formulario */}
            <div 
              ref={editorRef}
              className={`flex flex-col border-r h-full overflow-hidden transition-all ${showTutorial && tutorialStep === 3 ? "relative z-50 ring-4 ring-blue-500 shadow-2xl" : ""} ${isDarkMode ? "bg-[#090D16] border-[#F8FAFC]/10" : "bg-white border-neutral-200"}`}
            >
              <div className={`px-4 py-2 text-xs border-b font-mono flex justify-between items-center shrink-0 ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10 text-white/80" : "bg-neutral-100 border-neutral-200 text-neutral-700"}`}>
                <span>{viewMode === "yaml" ? "Código YAML" : "Formulario Visual Jerárquico"}</span>
                <span className="font-bold">{viewMode.toUpperCase()}</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {viewMode === "yaml" ? (
                  <div className="h-full">
                    {isClientReady ? (
                      <Editor
                        height="100%"
                        defaultLanguage="yaml"
                        theme={isDarkMode ? "navy-minimal" : "light"}
                        value={yamlContent}
                        beforeMount={handleEditorWillMount}
                        onChange={(value) => setYamlContent(value || "")}
                        options={{
                          fontSize: 13,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          lineNumbers: "on",
                          tabSize: 2,
                          automaticLayout: true,
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs opacity-50">
                        Cargando editor...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`p-6 space-y-6 ${isDarkMode ? "bg-[#090D16] text-[#F8FAFC]" : "bg-white text-neutral-900"}`}>
                    
                    {/* Bloque Información Personal */}
                    <div className={`border p-4 rounded-xl space-y-3 ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-neutral-50 border-neutral-200"}`}>
                      <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-[#0F172B]"}`}>Información Personal</h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Nombre</label>
                          <input
                            className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                            value={parsedYamlObj?.cv?.name || ""}
                            onChange={(e) => updateYamlData(o => { o.cv.name = e.target.value === "" ? null : e.target.value; })}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Carrera / Especialidad</label>
                          <input
                            className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                            value={parsedYamlObj?.cv?.headline || ""}
                            onChange={(e) => updateYamlData(o => { o.cv.headline = e.target.value === "" ? null : e.target.value; })}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Ubicación</label>
                          <input
                            className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                            value={parsedYamlObj?.cv?.location === null || parsedYamlObj?.cv?.location === undefined ? "" : parsedYamlObj.cv.location}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateYamlData(o => { o.cv.location = val === "" ? null : val; });
                            }}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Email</label>
                          <input
                            className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                            value={parsedYamlObj?.cv?.email === null || parsedYamlObj?.cv?.email === undefined ? "" : parsedYamlObj.cv.email}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateYamlData(o => { o.cv.email = val === "" ? null : val; });
                            }}
                          />
                          <p className={`text-[10px] mt-1 font-medium ${emailInfo.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                            {emailInfo.message}
                          </p>
                        </div>
                        <div>
                          <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Teléfono</label>
                          <input
                            className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                            value={parsedYamlObj?.cv?.phone === null || parsedYamlObj?.cv?.phone === undefined ? "" : parsedYamlObj.cv.phone}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateYamlData(o => { o.cv.phone = val === "" ? null : val; });
                            }}
                          />
                          <p className={`text-[10px] mt-1 font-medium ${phoneInfo.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                            {phoneInfo.message}
                          </p>
                        </div>
                        <div>
                          <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Sitio Web</label>
                          <input
                            className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                            value={parsedYamlObj?.cv?.website === null || parsedYamlObj?.cv?.website === undefined ? "" : parsedYamlObj.cv.website}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateYamlData(o => { o.cv.website = val === "" ? null : val; });
                            }}
                          />
                          <p className={`text-[10px] mt-1 font-medium ${websiteInfo.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                            {websiteInfo.message}
                          </p>
                        </div>
                        <div>
                          <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Foto URL</label>
                          <input
                            className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                            value={parsedYamlObj?.cv?.photo === null || parsedYamlObj?.cv?.photo === undefined ? "" : parsedYamlObj.cv.photo}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateYamlData(o => { o.cv.photo = val === "" ? null : val; });
                            }}
                          />
                          <p className={`text-[10px] mt-1 font-medium ${photoInfo.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                            {photoInfo.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bloque Redes Sociales */}
                    <div className={`border p-4 rounded-xl space-y-3 ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-neutral-50 border-neutral-200"}`}>
                      <div className="flex justify-between items-center">
                        <h3 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-[#0F172B]"}`}>Redes Sociales</h3>
                        <button
                          onClick={() => updateYamlData(o => { o.cv.social_networks = o.cv.social_networks || []; o.cv.social_networks.push({ network: "Instagram", username: "" }); })}
                          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded transition font-medium"
                        >
                          + Agregar red
                        </button>
                      </div>
                      {parsedYamlObj?.cv?.social_networks?.map((net: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center text-xs">
                          <div className="flex-1">
                            <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Red</label>
                            <select
                              className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                              value={net.network || "Instagram"}
                              onChange={(e) => updateYamlData(o => { o.cv.social_networks[idx].network = e.target.value; })}
                            >
                              {SOCIAL_NETWORKS_LIST.map((netName) => (
                                <option key={netName} value={netName} className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>{netName}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Usuario</label>
                            <input
                              className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#1D293D] border-[#F8FAFC]/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                              value={net.username || ""}
                              onChange={(e) => updateYamlData(o => { o.cv.social_networks[idx].username = e.target.value; })}
                            />
                          </div>
                          <div className="pt-5">
                            <button
                              onClick={() => updateYamlData(o => { o.cv.social_networks.splice(idx, 1); })}
                              className="text-red-400 hover:text-red-300 font-bold px-2 py-2 text-sm hover:bg-red-500/10 rounded"
                              title="Eliminar red social"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Secciones del CV */}
                    <div className="space-y-4">
                      <h3 className={`font-bold text-sm text-white ${isDarkMode ? 'bg-slate-800 border-[#F8FAFC]/10': "bg-blue-600 text-white" }  p-2.5 rounded-lg`}>Secciones del CV</h3>
                      {parsedYamlObj?.cv?.sections && Object.entries(parsedYamlObj.cv.sections).map(([secTitle, secItems]: [string, any], secIdx) => (
                        <div key={secIdx} className={`border p-4 rounded-xl space-y-3 shadow-sm relative ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10" : "bg-neutral-50 border-neutral-300"}`}>
                          <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? "border-white/10" : "border-neutral-200"}`}>
                            <span className={`font-semibold text-xs uppercase tracking-wide ${isDarkMode ? "text-blue-300" : "text-slate-800"}`}>{secTitle}</span>
                            <button
                              onClick={() => updateYamlData(o => { delete o.cv.sections[secTitle]; })}
                              className={`font-bold px-2 py-0.5 rounded text-xs transition ${isDarkMode ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                              title="Eliminar sección completa"
                            >
                              Eliminar sección ×
                            </button>
                          </div>

                          {Array.isArray(secItems) && secItems.map((item: any, itemIdx) => {
                            const dateCheck = validateDateString(item?.date, false);
                            const startDateCheck = validateDateString(item?.start_date, true,false);
                            const endDateCheck = validateDateString(item?.end_date, true, true);

                            return (
                              <div key={itemIdx} className={`border p-3 rounded-lg relative space-y-2 text-xs ${isDarkMode ? "bg-[#1D293D]/60 border-[#F8FAFC]/10 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/50" : "text-neutral-400"}`}>Elemento #{itemIdx + 1}</span>
                                  <button
                                    onClick={() => updateYamlData(o => { o.cv.sections[secTitle].splice(itemIdx, 1); })}
                                    className={`font-bold px-1.5 py-0.5 rounded ${isDarkMode ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"}`}
                                    title="Eliminar este elemento"
                                  >
                                    ×
                                  </button>
                                </div>

                                {typeof item === "string" ? (
                                  <div>
                                    <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Descripción</label>
                                    <textarea
                                      className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                      value={item}
                                      onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx] = e.target.value; })}
                                    />
                                  </div>
                                ) : item?.bullet !== undefined ? (
                                  <div>
                                    <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Viñeta</label>
                                    <input
                                      className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                      value={item.bullet || ""}
                                      placeholder="Texto de viñeta"
                                      onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].bullet = e.target.value; })}
                                    />
                                  </div>
                                ) : item?.number !== undefined ? (
                                  <div>
                                    <input
                                      className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                      value={item.number || ""}
                                      placeholder="Texto"
                                      onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].number = e.target.value; })}
                                    />
                                  </div>
                                ) : item?.reversed_number !== undefined ? (
                                  <div>
                                    <input
                                      className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                      value={item.reversed_number || ""}
                                      placeholder="Texto"
                                      onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].reversed_number = e.target.value; })}
                                    />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    {item.company !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Empresa</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.company || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].company = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.position !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Posición</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.position || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].position = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.institution !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Institución</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.institution || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].institution = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.area !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Área</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.area || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].area = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.degree !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Título</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.degree || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].degree = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.name !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Nombre</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.name || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].name = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.title !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Título</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.title || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].title = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.journal !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Revista</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.journal || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].journal = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.date !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Fecha (Opcional)</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          placeholder="YYYY o YYYY-MM"
                                          value={item.date === null ? "" : item.date}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateYamlData(o => { o.cv.sections[secTitle][itemIdx].date = val === "" ? null : val; });
                                          }}
                                        />
                                        {item.date !== null && item.date !== undefined && String(item.date).trim() !== "" && (
                                          <p className={`text-[10px] mt-0.5 font-medium ${dateCheck.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                                            {dateCheck.message}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {item.start_date !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Fecha de Inicio</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          placeholder="YYYY o YYYY-MM"
                                          value={item.start_date || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].start_date = e.target.value; })}
                                        />
                                        {item.start_date !== undefined && (
                                          <p className={`text-[10px] mt-0.5 font-medium ${startDateCheck.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                                            {startDateCheck.message}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {item.end_date !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Fecha de Fin</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          placeholder="YYYY, YYYY-MM o present"
                                          value={item.end_date || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].end_date = e.target.value; })}
                                        />
                                        {item.end_date !== undefined && (
                                          <p className={`text-[10px] mt-0.5 font-medium ${endDateCheck.isValid ? "text-emerald-400" : "text-amber-400"}`}>
                                            {endDateCheck.message}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {item.location !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Ubicación</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.location === null || item.location === undefined ? "" : item.location}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateYamlData(o => { o.cv.sections[secTitle][itemIdx].location = val === "" ? null : val; });
                                          }}
                                        />
                                      </div>
                                    )}
                                    {item.url !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>URL</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          placeholder="https://..."
                                          value={item.url === null || item.url === undefined ? "" : item.url}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateYamlData(o => { o.cv.sections[secTitle][itemIdx].url = val === "" ? null : val; });
                                          }}
                                        />
                                        <p className={`text-[10px] mt-1 font-medium ${validateUrl(item.url || "").isValid ? "text-emerald-400" : "text-amber-400"}`}>
                                          {validateUrl(item.url || "").message}
                                        </p>
                                      </div>
                                    )}
                                    {item.label !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Etiqueta</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.label || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].label = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.details !== undefined && (
                                      <div>
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Detalles</label>
                                        <input
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.details || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].details = e.target.value; })}
                                        />
                                      </div>
                                    )}
                                    {item.summary !== undefined && (
                                      <div className="col-span-2">
                                        <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Resumen</label>
                                        <textarea
                                          className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                          value={item.summary || ""}
                                          onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].summary = e.target.value; })}
                                        />
                                      </div>
                                    )}

                                    {Array.isArray(item.authors) && (
                                      <div className={`col-span-2 border-t pt-2 mt-2 space-y-1 ${isDarkMode ? "border-white/10" : "border-neutral-200"}`}>
                                        <div className="flex justify-between items-center">
                                          <span className={`font-semibold ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Autores:</span>
                                          <button
                                            onClick={() => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].authors.push("Nuevo Autor"); })}
                                            className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition font-medium"
                                          >
                                            + Agregar autor
                                          </button>
                                        </div>
                                        {item.authors.map((auth: string, authIdx: number) => (
                                          <div key={authIdx} className="flex gap-1 items-center">
                                            <input
                                              className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                              value={auth}
                                              onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].authors[authIdx] = e.target.value; })}
                                            />
                                            <button
                                              onClick={() => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].authors.splice(authIdx, 1); })}
                                              className="text-red-400 font-bold px-2 py-1"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {Array.isArray(item.highlights) && (
                                      <div className={`col-span-2 border-t pt-2 mt-2 space-y-1 ${isDarkMode ? "border-white/10" : "border-neutral-200"}`}>
                                        <div className="flex justify-between items-center">
                                          <span className={`font-semibold ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Highlights / Logros:</span>
                                          <button
                                            onClick={() => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].highlights.push("Nuevo logro"); })}
                                            className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition font-medium"
                                          >
                                            + Agregar highlight
                                          </button>
                                        </div>
                                        {item.highlights.map((high: string, highIdx: number) => (
                                          <div key={highIdx} className="flex gap-1 items-center">
                                            <input
                                              className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                                              value={high}
                                              onChange={(e) => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].highlights[highIdx] = e.target.value; })}
                                            />
                                            <button
                                              onClick={() => updateYamlData(o => { o.cv.sections[secTitle][itemIdx].highlights.splice(highIdx, 1); })}
                                              className="text-red-400 font-bold px-2 py-1"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <button
                            onClick={() => {
                              const first = secItems?.[0];
                              let tName = "Texto";
                              if (typeof first === "object" && first !== null) {
                                if (first.company !== undefined) tName = "Experiencia";
                                else if (first.institution !== undefined) tName = "Educación";
                                else if (first.title !== undefined) tName = "Publicación";
                                else if (first.label !== undefined) tName = "En Línea";
                                else if (first.bullet !== undefined) tName = "Viñeta";
                                else if (first.number !== undefined) tName = "Numerada";
                                else if (first.reversed_number !== undefined) tName = "Numerada Inversa";
                                else if (first.name !== undefined) tName = "Proyecto Normal";
                              }
                              handleAddEntryToSection(secTitle, tName);
                            }}
                            className={`w-full py-2 rounded-lg text-xs font-semibold border transition ${isDarkMode ? "bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
                          >
                            + Agregar elemento a esta sección
                          </button>
                        </div>
                      ))}

                      <div className={`border-2 border-dashed p-4 rounded-xl space-y-3 ${isDarkMode ? "bg-[#0F172B]/50 border-white/20" : "bg-neutral-50 border-neutral-300"}`}>
                        <h4 className={`font-bold text-xs ${isDarkMode ? "text-white" : "text-neutral-800"}`}>Agregar Nueva Sección</h4>
                        <div className="flex gap-2 text-xs">
                          <div className="flex-1">
                            <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Título de Sección</label>
                            <input
                              className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white placeholder-white/30" : "bg-white border-neutral-300 text-neutral-900"}`}
                              value={newSecTitle}
                              onChange={(e) => setNewSecTitle(e.target.value)}
                            />
                          </div>
                          <div className="w-40">
                            <label className={`block mb-1 font-medium ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>Tipo de Bloque</label>
                            <select
                              className={`w-full border rounded p-2 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-300 text-neutral-900"}`}
                              value={newSecType}
                              onChange={(e) => setNewSecType(e.target.value)}
                            >
                              <option value="Texto" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Texto</option>
                              <option value="Experiencia" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Experiencia</option>
                              <option value="Educación" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Educación</option>
                              <option value="Publicación" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Publicación</option>
                              <option value="Proyecto Normal" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Proyecto Normal</option>
                              <option value="En Línea" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>En Línea</option>
                              <option value="Viñeta" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Viñeta</option>
                              <option value="Numerada" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Numerada</option>
                              <option value="Numerada Inversa" className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>Numerada Inversa</option>
                            </select>
                          </div>
                          <div className="pt-5">
                            <button
                              onClick={handleAddNewSection}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition h-[34px]"
                            >
                              Crear sección
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Vista Previa PDF */}
            <div 
              ref={previewRef}
              className={`flex flex-col h-full overflow-hidden transition-all ${showTutorial && tutorialStep === 7 ? "relative z-50 ring-4 ring-blue-500 shadow-2xl" : ""} ${isDarkMode ? "bg-[#090D16]" : "bg-neutral-100"}`}
            >
              <div className={`px-4 py-2 text-xs border-b font-mono flex justify-between items-center shrink-0 ${isDarkMode ? "bg-[#0F172B] border-[#F8FAFC]/10 text-white/80" : "bg-neutral-100 border-neutral-200 text-neutral-700"}`}>
                <span>PDF en Vivo</span>
                {pdfUrl && (
                  <a 
                    ref={downloadRef}
                    href={isAuthenticated ? pdfUrl : "#"} 
                    onClick={(e) => {
                      if (!isAuthenticated) {
                        e.preventDefault();
                        setShowGuestDownloadModal(true);
                      }
                    }}
                    download={isAuthenticated ? "Mi_CV.pdf" : undefined}
                    className={`hover:underline -pt-10 font-semibold flex items-center gap-1.5 text-blue-400 transition-all cursor-pointer ${showTutorial && tutorialStep === 8 ? "relative z-50 ring-4 ring-emerald-400 p-1 rounded bg-blue-950 shadow-2xl" : ""}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar PDF
                  </a>
                )}
              </div>

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
                  <p className="text-xs opacity-60 animate-pulse">Generando documento inicial...</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODAL NUEVO CV */}
      {showCreateModal && (
        <div 
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`w-full max-w-[50rem] h-[82vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-200 text-slate-900"}`}
          >
            
            <div className="px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold">Crear Nuevo Currículum</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              <div className="p-6 flex flex-col justify-between overflow-y-auto border-r border-neutral-700/20 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">Nombre del CV</label>
                    <input 
                      type="text"
                      value={newCvTitleInput}
                      onChange={(e) => setNewCvTitleInput(e.target.value)}
                      placeholder="Ej: CV Desarrollador Frontend"
                      className={`w-full border rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? "bg-[#1D293D] border-white/20 text-white" : "bg-neutral-50 border-neutral-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-2 opacity-80">Seleccionar Plantilla</label>
                    <div className="grid grid-cols-2 gap-2 max-h-66 overflow-y-auto pr-1">
                      {TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl}
                          onClick={() => setModalSelectedTheme(tmpl)}
                          className={`p-2 rounded-md border text-left text-xs font-semibold capitalize transition ${
                            modalSelectedTheme === tmpl 
                              ? "bg-blue-600 text-white border-blue-500 shadow-md" 
                              : (isDarkMode ? "bg-[#1D293D]/50 border-white/10 hover:bg-[#1D293D]" : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100")
                          }`}
                        >
                          {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 opacity-80">Tipografía</label>
                    <select
                      value={modalSelectedFont}
                      onChange={(e) => setModalSelectedFont(e.target.value)}
                      className={`w-full border rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${isDarkMode ? "bg-[#1D293D] border-white/20 text-white" : "bg-neutral-50 border-neutral-300"}`}
                    >
                      {FONTS_LIST.map((font) => (
                        <option key={font} value={font} className={isDarkMode ? "bg-[#0F172B] text-white" : "bg-white text-black"}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-700/20">
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border text-xs font-semibold hover:bg-neutral-500/10 transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirmCreateCv}
                    className="px-10 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md transition"
                  >
                    Crear CV
                  </button>
                </div>
              </div>

              <div className={`flex flex-col items-center justify-center ${isDarkMode ? "" : "border-t border-white/60" } bg-neutral-900/50 overflow-hidden`}>
                <div className="w-full h-full relative overflow-hidden border-white/10 shadow-inner flex items-center justify-center bg-white">
                  <img 
                    src={`/CV-${modalSelectedTheme}.png`} 
                    alt={`Plantilla ${modalSelectedTheme}`} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL INVITADO NECESITA LOGIN PARA DESCARGAR */}
      {showGuestDownloadModal && (
        <div onClick={() => setShowGuestDownloadModal(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-4 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-200 text-slate-900"}`}>
            <h3 className="text-base font-bold">¡Iniciá sesión para descargar!</h3>
            <p className="text-xs opacity-80 leading-relaxed">
              Necesitás iniciar sesión con Google para descargar tu CV y guardarlo de forma segura en la nube. ¡No vas a perder nada de lo que editaste!
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={async () => {
                  await authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/",
                  });
                }}
                className="w-full py-2.5 px-3 bg-white text-slate-900 border font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.22 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.4l4.09-3.16z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.99 6.73-4.99z"/>
                </svg>
                <span>Continuar con Google</span>
              </button>
              <button 
                onClick={() => setShowGuestDownloadModal(false)}
                className="w-full py-2 rounded-xl border text-xs font-semibold hover:bg-neutral-500/10 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CAMBIOS NO GUARDADOS */}
      {showUnsavedModal && (
        <div onClick={() => setShowUnsavedModal(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-4 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-200 text-slate-900"}`}>
            <h3 className="text-base font-bold">Cambios sin guardar</h3>
            <p className="text-xs opacity-80 leading-relaxed">
              Tienes modificaciones pendientes en tu CV actual que aún se están sincronizando. ¿Estás seguro de salir o cambiar de CV? Podrías perder los cambios recientes.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => { setShowUnsavedModal(false); setPendingAction(null); }}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-neutral-500/10 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowUnsavedModal(false);
                  if (pendingAction) pendingAction();
                  setPendingAction(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RENOMBRAR CV */}
      {showRenameModal && targetCv && (
        <div onClick={() => setShowRenameModal(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-4 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-200 text-slate-900"}`}>
            <h3 className="text-base font-bold">Renombrar Currículum</h3>
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Nuevo Nombre</label>
              <input 
                type="text"
                autoFocus
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                className={`w-full border rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? "bg-[#1D293D] border-white/20 text-white" : "bg-neutral-50 border-neutral-300"}`}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-neutral-500/10 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmRename}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR CV */}
      {showDeleteModal && targetCv && (
        <div onClick={() => setShowDeleteModal(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border space-y-5 transform transition-all ${
              isDarkMode 
                ? "bg-[#0F172B] border-white/10 text-white shadow-black/50" 
                : "bg-white border-neutral-200 text-slate-900 shadow-xl"
            }`}
          >
            {/* Icono de advertencia superior */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-md font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Eliminar Currículum</h3>
              </div>
            </div>

            {/* Mensaje descriptivo */}
            <p className={`text-xs leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-neutral-600"}`}>
              ¿Estás seguro de que deseas eliminar <strong className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>"{targetCv.title}"</strong>? <br></br> Perderás todo el contenido guardado en este archivo.
            </p>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  isDarkMode 
                    ? "border-white/10 hover:bg-white/5 text-neutral-300" 
                    : "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RENOMBRAR ADAPTACIÓN */}
      {showAdaptRenameModal && targetAdapt && (
        <div onClick={() => setShowAdaptRenameModal(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-4 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-200 text-slate-900"}`}>
            <h3 className="text-base font-bold">Renombrar Adaptación</h3>
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80">Nuevo Puesto / Título</label>
              <input 
                type="text"
                autoFocus
                value={adaptRenameInputValue}
                onChange={(e) => setAdaptRenameInputValue(e.target.value)}
                className={`w-full border rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? "bg-[#1D293D] border-white/20 text-white" : "bg-neutral-50 border-neutral-300"}`}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowAdaptRenameModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-neutral-500/10 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmAdaptRename}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR ADAPTACIÓN */}
      {showAdaptDeleteModal && targetAdapt && (
        <div onClick={() => setShowAdaptDeleteModal(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border space-y-5 transform transition-all ${
              isDarkMode 
                ? "bg-[#0F172B] border-white/10 text-white shadow-black/50" 
                : "bg-white border-neutral-200 text-slate-900 shadow-xl"
            }`}
          >
            {/* Icono de advertencia superior */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-md font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Eliminar Adaptación</h3>
              </div>
            </div>

            {/* Mensaje descriptivo */}
            <p className={`text-xs leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-neutral-600"}`}>
              ¿Estás seguro de que deseas eliminar la adaptación para <strong className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>"{targetAdapt.jobTitle || targetAdapt.title}"</strong>? <br /> Perderás todo el contenido guardado en este archivo.
            </p>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                onClick={() => setShowAdaptDeleteModal(false)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  isDarkMode 
                    ? "border-white/10 hover:bg-white/5 text-neutral-300" 
                    : "border-neutral-200 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmAdaptDelete}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SPOTLIGHT DINÁMICO DE TUTORIAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] transition-all pointer-events-auto">
          <div 
            style={getModalPositionStyle()} 
            className={`w-80 rounded-2xl shadow-2xl p-5 border z-[999] animate-in fade-in zoom-in duration-200 ${isDarkMode ? "bg-[#0F172B] border-white/20 text-white" : "bg-white border-neutral-200 text-slate-900"}`}
          >
            <button 
              onClick={() => setShowTutorial(false)}
              className="absolute top-3 right-3 opacity-70 hover:opacity-100 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-mono opacity-60">
                <span>Paso {tutorialStep} de {totalTutorialSteps}</span>
              </div>

              {tutorialStep === 1 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Crear e Importar CV</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Comenzá creando un nuevo CV desde cero o importando un documento existente en formato PDF o Word.
                  </p>
                </div>
              )}

              {tutorialStep === 2 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Adaptar CV</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Utiliza esta función para adaptar inteligentemente tu CV según las exigencias de una oferta laboral específica.
                  </p>
                </div>
              )}

              {tutorialStep === 3 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Editor de Código YAML</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Acá podes editar el contenido de tu CV con sintaxis YAML limpia. Cuenta con resaltado de sintaxis optimizado para programadores y sincronización instantánea.
                  </p>
                </div>
              )}

              {tutorialStep === 4 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Selección de Plantilla</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Elegí entre múltiples plantillas tipográficas profesionales de diseño optimizado para cambiar el aspecto visual de tu CV al instante.
                  </p>
                </div>
              )}

              {tutorialStep === 5 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Selección de Tipografía</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Personaliza el estilo tipográfico de tu currículum eligiendo entre una amplia variedad de fuentes profesionales adaptadas para documentos formales.
                  </p>
                </div>
              )}

              {tutorialStep === 6 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Formulario Visual Intuitivo</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Si preferís no usar código, cambia al modo Formulario Jerárquico para rellenar tus datos personales, experiencia y proyectos mediante campos guiados.
                  </p>
                </div>
              )}

              {tutorialStep === 7 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Vista Previa en Vivo</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Visualiza los cambios de tu CV renderizados en tiempo real a medida que editas. Cada ajuste tipográfico se actualiza al instante.
                  </p>
                </div>
              )}

              {tutorialStep === 8 && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Descarga y Exportación</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Descarga tu documento final en formato PDF con calidad tipográfica profesional listo para enviar a tus postulaciones laborales.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-neutral-700/20">
                <button
                  onClick={() => setTutorialStep((prev) => Math.max(prev - 1, 1))}
                  disabled={tutorialStep === 1}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${tutorialStep === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-neutral-500/10"}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </button>

                {tutorialStep < totalTutorialSteps ? (
                  <button
                    onClick={() => setTutorialStep((prev) => Math.min(prev + 1, totalTutorialSteps))}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
                  >
                    Siguiente <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
                  >
                    ¡Entendido!
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
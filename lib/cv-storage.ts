import { Cv, CvSchema, emptyCv } from "./cv-schema";

const ADAPTATIONS_KEY = "palatime:adaptations";
const LOCAL_CVS_KEY = "palatime_local_cvs";

export interface AdaptationRecord {
  id: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  cv: Cv;
}

/**
 * @deprecated Mantener por compatibilidad, pero se recomienda obtener el CV base desde el estado de la sesión o API.
 */
export function getBaseCv(): Cv | null {
  if (typeof window === "undefined") return null;
  
  // Intentamos leer el primer CV disponible del almacenamiento local de invitado o fallback
  try {
    const rawLocal = window.localStorage.getItem(LOCAL_CVS_KEY);
    if (rawLocal) {
      const cvs = JSON.parse(rawLocal);
      if (Array.isArray(cvs) && cvs.length > 0 && cvs[0].yamlContent) {
        // Si el yamlContent está disponible, intentamos parsearlo si fuera necesario, 
        // o devolvemos un objeto compatible.
      }
    }
  } catch (e) {
    console.error("Error leyendo CV base auxiliar:", e);
  }

  return null;
}

export function hasBaseCv(): boolean {
  return true; // Ya no bloqueamos la app por un único CV base fijo.
}

export function saveBaseCv(cv: Cv): void {
  // Función de compatibilidad legacy. La lógica actual guarda en BD o local_cvs.
  if (typeof window === "undefined") return;
  window.localStorage.setItem("palatime:baseCv", JSON.stringify(cv));
}

export function newExperienceId(): string {
  return `exp_${Math.random().toString(36).slice(2, 9)}`;
}

export function listAdaptations(): AdaptationRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ADAPTATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAdaptation(record: AdaptationRecord): void {
  const all = listAdaptations();
  all.unshift(record);
  window.localStorage.setItem(ADAPTATIONS_KEY, JSON.stringify(all));
}

export function getAdaptation(id: string): AdaptationRecord | null {
  return listAdaptations().find((a) => a.id === id) ?? null;
}

export function updateAdaptation(id: string, cv: Cv): void {
  const all = listAdaptations().map((a) => (a.id === id ? { ...a, cv } : a));
  window.localStorage.setItem(ADAPTATIONS_KEY, JSON.stringify(all));
}

export { emptyCv };
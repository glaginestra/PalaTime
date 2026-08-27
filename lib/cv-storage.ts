import { Cv, CvSchema, emptyCv } from "./cv-schema";

// NOTA IMPORTANTE PARA CUANDO SUMES AUTH + POSTGRES:
// Esto es un placeholder de la Fase 1. Reemplazar por llamadas a tu API
// (/api/cvs) respaldadas por la base de datos, manteniendo la misma
// interfaz (getBaseCv, saveBaseCv, listAdaptations, saveAdaptation) para
// no tener que tocar los componentes que las consumen.

const BASE_CV_KEY = "palatime:baseCv";
const ADAPTATIONS_KEY = "palatime:adaptations";

export interface AdaptationRecord {
  id: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  cv: Cv;
}

export function getBaseCv(): Cv | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BASE_CV_KEY);
  if (!raw) return null;
  try {
    return CvSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function hasBaseCv(): boolean {
  return getBaseCv() !== null;
}

// Guarda un CV como base. Si todavía no existe ninguno, esto es lo que
// hace que "el primer CV creado o importado" quede como base automáticamente:
// simplemente se llama a esta función una sola vez, al finalizar el
// formulario o al terminar de importar, sin preguntarle nada al usuario.
export function saveBaseCv(cv: Cv): void {
  window.localStorage.setItem(BASE_CV_KEY, JSON.stringify(cv));
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

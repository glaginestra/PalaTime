import { z } from "zod";

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio"),
  headline: z.string().optional().default(""),
  location: z.string().optional().default(""),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  website: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
});

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "La empresa es obligatoria"),
  role: z.string().min(1, "El puesto es obligatorio"),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "La institución es obligatoria"),
  degree: z.string().min(1, "El título/carrera es obligatorio"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  details: z.string().optional().default(""),
});

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre del proyecto es obligatorio"),
  date: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export const LanguageItemSchema = z.object({
  id: z.string(),
  language: z.string().min(1),
  level: z.string().optional().default(""),
});

export const CvSchema = z.object({
  personalInfo: PersonalInfoSchema,
  summary: z.string().optional().default(""),
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  languages: z.array(LanguageItemSchema).default([]),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
export type LanguageItem = z.infer<typeof LanguageItemSchema>;
export type Cv = z.infer<typeof CvSchema>;

export function emptyCv(): Cv {
  return {
    personalInfo: {
      fullName: "",
      headline: "",
      location: "",
      email: "",
      phone: "",
      website: "",
      linkedin: "",
      github: "",
    },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    softSkills: [],
    languages: [],
  };
}

// Schema que se le exige a Gemini como response schema (adaptación).
// Se mantiene deliberadamente idéntico a CvSchema: nunca le pedimos a la IA
// texto libre, siempre la misma estructura que ya validamos en el resto de la app.
export const geminiCvResponseSchema = {
  type: "object",
  properties: {
    personalInfo: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        headline: { type: "string" },
        location: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        website: { type: "string" },
        linkedin: { type: "string" },
        github: { type: "string" },
      },
      required: ["fullName"],
    },
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          company: { type: "string" },
          role: { type: "string" },
          location: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          current: { type: "boolean" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["id", "company", "role"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          institution: { type: "string" },
          degree: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          details: { type: "string" },
        },
        required: ["id", "institution", "degree"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          date: { type: "string" },
          description: { type: "string" },
        },
        required: ["id", "name"],
      },
    },
    skills: { type: "array", items: { type: "string" } },
    softSkills: { type: "array", items: { type: "string" } },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          language: { type: "string" },
          level: { type: "string" },
        },
        required: ["id", "language"],
      },
    },
  },
  required: ["personalInfo", "summary", "experience", "education", "skills"],
} as const;

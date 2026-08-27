"use client";

import { useState } from "react";
import {
  Cv,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  LanguageItem,
} from "@/lib/cv-schema";
import { newExperienceId } from "@/lib/cv-storage";

export default function CvForm({
  cv,
  onChange,
  onFinish,
}: {
  cv: Cv;
  onChange: (cv: Cv) => void;
  onFinish: () => void;
}) {
  const [skillInput, setSkillInput] = useState("");
  const [softSkillInput, setSoftSkillInput] = useState("");

  const canFinish = cv.personalInfo.fullName.trim().length > 0;

  function update<K extends keyof Cv>(key: K, value: Cv[K]) {
    onChange({ ...cv, [key]: value });
  }

  function updatePersonal<K extends keyof Cv["personalInfo"]>(
    key: K,
    value: Cv["personalInfo"][K]
  ) {
    onChange({ ...cv, personalInfo: { ...cv.personalInfo, [key]: value } });
  }

  function addExperience() {
    const item: ExperienceItem = {
      id: newExperienceId(),
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [],
    };
    update("experience", [...cv.experience, item]);
  }

  function updateExperience(id: string, patch: Partial<ExperienceItem>) {
    update(
      "experience",
      cv.experience.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }

  function removeExperience(id: string) {
    update(
      "experience",
      cv.experience.filter((e) => e.id !== id)
    );
  }

  function addEducation() {
    const item: EducationItem = {
      id: newExperienceId(),
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      details: "",
    };
    update("education", [...cv.education, item]);
  }

  function updateEducation(id: string, patch: Partial<EducationItem>) {
    update(
      "education",
      cv.education.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }

  function removeEducation(id: string) {
    update(
      "education",
      cv.education.filter((e) => e.id !== id)
    );
  }

  function addProject() {
    const item: ProjectItem = {
      id: newExperienceId(),
      name: "",
      date: "",
      description: "",
    };
    update("projects", [...cv.projects, item]);
  }

  function updateProject(id: string, patch: Partial<ProjectItem>) {
    update(
      "projects",
      cv.projects.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }

  function removeProject(id: string) {
    update(
      "projects",
      cv.projects.filter((p) => p.id !== id)
    );
  }

  function addLanguage() {
    const item: LanguageItem = { id: newExperienceId(), language: "", level: "" };
    update("languages", [...cv.languages, item]);
  }

  function updateLanguage(id: string, patch: Partial<LanguageItem>) {
    update(
      "languages",
      cv.languages.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  function removeLanguage(id: string) {
    update(
      "languages",
      cv.languages.filter((l) => l.id !== id)
    );
  }

  function addSkill() {
    const v = skillInput.trim();
    if (!v) return;
    update("skills", [...cv.skills, v]);
    setSkillInput("");
  }

  function addSoftSkill() {
    const v = softSkillInput.trim();
    if (!v) return;
    update("softSkills", [...cv.softSkills, v]);
    setSoftSkillInput("");
  }

  return (
    <div className="space-y-8">
      <FormSection title="Datos personales">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre completo" required>
            <input
              className="input"
              value={cv.personalInfo.fullName}
              onChange={(e) => updatePersonal("fullName", e.target.value)}
              placeholder="Gastón Nicolás Laginestra"
            />
          </Field>
          <Field label="Título / rol">
            <input
              className="input"
              value={cv.personalInfo.headline}
              onChange={(e) => updatePersonal("headline", e.target.value)}
              placeholder="Estudiante de ingeniería informática"
            />
          </Field>
          <Field label="Ubicación">
            <input
              className="input"
              value={cv.personalInfo.location}
              onChange={(e) => updatePersonal("location", e.target.value)}
              placeholder="CABA, Argentina"
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              value={cv.personalInfo.email}
              onChange={(e) => updatePersonal("email", e.target.value)}
              placeholder="nombre@email.com"
            />
          </Field>
          <Field label="Teléfono">
            <input
              className="input"
              value={cv.personalInfo.phone}
              onChange={(e) => updatePersonal("phone", e.target.value)}
              placeholder="+54 11 2322-3519"
            />
          </Field>
          <Field label="Sitio web / portfolio">
            <input
              className="input"
              value={cv.personalInfo.website}
              onChange={(e) => updatePersonal("website", e.target.value)}
              placeholder="portfolio.vercel.app"
            />
          </Field>
          <Field label="LinkedIn">
            <input
              className="input"
              value={cv.personalInfo.linkedin}
              onChange={(e) => updatePersonal("linkedin", e.target.value)}
              placeholder="linkedin.com/in/usuario"
            />
          </Field>
          <Field label="GitHub">
            <input
              className="input"
              value={cv.personalInfo.github}
              onChange={(e) => updatePersonal("github", e.target.value)}
              placeholder="github.com/usuario"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Resumen">
        <textarea
          className="input min-h-[90px]"
          value={cv.summary}
          onChange={(e) => update("summary", e.target.value)}
          placeholder="2-3 líneas contando quién sos y qué buscás."
        />
      </FormSection>

      <FormSection title="Experiencia">
        {cv.experience.map((exp) => (
          <div key={exp.id} className="border border-neutral-200 rounded-lg p-4 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Puesto"
                value={exp.role}
                onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
              />
              <input
                className="input"
                placeholder="Empresa"
                value={exp.company}
                onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
              />
              <input
                className="input"
                placeholder="Desde (ej: Mar 2023)"
                value={exp.startDate}
                onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
              />
              <div className="flex gap-2 items-center">
                <input
                  className="input flex-1"
                  placeholder="Hasta"
                  disabled={exp.current}
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                />
                <label className="text-xs text-neutral-600 flex items-center gap-1 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, { current: e.target.checked })}
                  />
                  Actual
                </label>
              </div>
            </div>
            <textarea
              className="input min-h-[70px]"
              placeholder="Logros, uno por línea"
              value={exp.bullets.join("\n")}
              onChange={(e) =>
                updateExperience(exp.id, {
                  bullets: e.target.value.split("\n").filter((b) => b.trim().length > 0),
                })
              }
            />
            <button className="text-xs text-red-600" onClick={() => removeExperience(exp.id)}>
              Eliminar experiencia
            </button>
          </div>
        ))}
        <button className="btn-secondary" onClick={addExperience}>
          + Agregar experiencia
        </button>
      </FormSection>

      <FormSection title="Educación">
        {cv.education.map((ed) => (
          <div key={ed.id} className="border border-neutral-200 rounded-lg p-4 mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Institución"
                value={ed.institution}
                onChange={(e) => updateEducation(ed.id, { institution: e.target.value })}
              />
              <input
                className="input"
                placeholder="Título / carrera"
                value={ed.degree}
                onChange={(e) => updateEducation(ed.id, { degree: e.target.value })}
              />
              <input
                className="input"
                placeholder="Desde"
                value={ed.startDate}
                onChange={(e) => updateEducation(ed.id, { startDate: e.target.value })}
              />
              <input
                className="input"
                placeholder="Hasta"
                value={ed.endDate}
                onChange={(e) => updateEducation(ed.id, { endDate: e.target.value })}
              />
            </div>
            <button className="text-xs text-red-600" onClick={() => removeEducation(ed.id)}>
              Eliminar
            </button>
          </div>
        ))}
        <button className="btn-secondary" onClick={addEducation}>
          + Agregar educación
        </button>
      </FormSection>

      <FormSection title="Proyectos personales">
        {cv.projects.map((p) => (
          <div key={p.id} className="border border-neutral-200 rounded-lg p-4 mb-3 space-y-2">
            <input
              className="input"
              placeholder="Nombre del proyecto"
              value={p.name}
              onChange={(e) => updateProject(p.id, { name: e.target.value })}
            />
            <textarea
              className="input min-h-[60px]"
              placeholder="Descripción"
              value={p.description}
              onChange={(e) => updateProject(p.id, { description: e.target.value })}
            />
            <button className="text-xs text-red-600" onClick={() => removeProject(p.id)}>
              Eliminar
            </button>
          </div>
        ))}
        <button className="btn-secondary" onClick={addProject}>
          + Agregar proyecto
        </button>
      </FormSection>

      <FormSection title="Habilidades técnicas">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cv.skills.map((s, i) => (
            <Chip key={i} onRemove={() => update("skills", cv.skills.filter((_, idx) => idx !== i))}>
              {s}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="Python, React, SQL..."
          />
          <button className="btn-secondary" onClick={addSkill}>
            Agregar
          </button>
        </div>
      </FormSection>

      <FormSection title="Habilidades blandas">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cv.softSkills.map((s, i) => (
            <Chip
              key={i}
              onRemove={() => update("softSkills", cv.softSkills.filter((_, idx) => idx !== i))}
            >
              {s}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            value={softSkillInput}
            onChange={(e) => setSoftSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSoftSkill())}
            placeholder="Trabajo en equipo, comunicación..."
          />
          <button className="btn-secondary" onClick={addSoftSkill}>
            Agregar
          </button>
        </div>
      </FormSection>

      <FormSection title="Idiomas">
        {cv.languages.map((l) => (
          <div key={l.id} className="flex gap-2 mb-2">
            <input
              className="input"
              placeholder="Idioma"
              value={l.language}
              onChange={(e) => updateLanguage(l.id, { language: e.target.value })}
            />
            <input
              className="input"
              placeholder="Nivel"
              value={l.level}
              onChange={(e) => updateLanguage(l.id, { level: e.target.value })}
            />
            <button className="text-xs text-red-600" onClick={() => removeLanguage(l.id)}>
              Eliminar
            </button>
          </div>
        ))}
        <button className="btn-secondary" onClick={addLanguage}>
          + Agregar idioma
        </button>
      </FormSection>

      <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-neutral-200">
        {!canFinish && (
          <p className="text-xs text-amber-600 mb-2">
            Completá al menos tu nombre para poder continuar.
          </p>
        )}
        <button className="btn-primary w-full" disabled={!canFinish} onClick={onFinish}>
          Finalizar y ver mi CV
        </button>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-neutral-800 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-neutral-600 mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-full">
      {children}
      <button onClick={onRemove} className="text-neutral-400 hover:text-neutral-700">
        ×
      </button>
    </span>
  );
}

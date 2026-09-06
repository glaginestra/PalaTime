"use client";

import { Cv } from "@/lib/cv-schema";

export default function CvPreview({ cv }: { cv: any }) {
  // Desenvuelve automáticamente si viene anidado en { cv: { ... } }
  const rawCv = cv?.cv || cv || {};
  const safeCv = rawCv.cv || rawCv;

  const personalInfo = safeCv.personalInfo || {
    fullName: "",
    headline: "",
    location: "",
    phone: "",
    email: "",
    website: "",
    linkedin: "",
    github: "",
  };

  const experience = safeCv.experience || [];
  const education = safeCv.education || [];
  const projects = safeCv.projects || [];
  const skills = safeCv.skills || [];
  const softSkills = safeCv.softSkills || [];
  const languages = safeCv.languages || [];

  return (
    <div className="bg-white text-neutral-900 shadow-sm border border-neutral-200 rounded-lg p-8 w-full max-w-[750px] mx-auto text-[13px] leading-relaxed font-sans">
      <header className="border-b border-neutral-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          {personalInfo.fullName || "Tu Nombre"}
        </h1>
        {personalInfo.headline && (
          <p className="text-sm font-medium text-neutral-600 mt-0.5">
            {personalInfo.headline}
          </p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 mt-3">
          {personalInfo.location && <span>📍 {personalInfo.location}</span>}
          {personalInfo.email && <span>✉️ {personalInfo.email}</span>}
          {personalInfo.phone && <span>📞 {personalInfo.phone}</span>}
          {personalInfo.website && <span>🌐 {personalInfo.website}</span>}
          {personalInfo.linkedin && <span>🔗 {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>💻 {personalInfo.github}</span>}
        </div>
      </header>

      {safeCv.summary && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Perfil Profesional
          </h2>
          <p className="text-neutral-700 whitespace-pre-line">{safeCv.summary}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 border-b border-neutral-100 pb-1">
            Experiencia
          </h2>
          <div className="space-y-4">
            {experience.map((exp: any, i: number) => (
              <div key={exp.id || i}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-neutral-800">
                    {exp.role} {exp.company && `— ${exp.company}`}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {exp.startDate}{" "}
                    {exp.startDate && (exp.endDate || exp.current) && "–"}{" "}
                    {exp.current ? "Presente" : exp.endDate}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc list-inside text-neutral-600 text-xs mt-1 space-y-0.5">
                    {exp.bullets.map((bullet: string, idx: number) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 border-b border-neutral-100 pb-1">
            Educación
          </h2>
          <div className="space-y-3">
            {education.map((ed: any, i: number) => (
              <div key={ed.id || i} className="flex justify-between items-baseline">
                <div>
                  <div className="font-semibold text-neutral-800">
                    {ed.institution}
                  </div>
                  <div className="text-xs text-neutral-600">{ed.degree}</div>
                  {ed.details && (
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {ed.details}
                    </div>
                  )}
                </div>
                <span className="text-xs text-neutral-400">
                  {ed.startDate} {ed.startDate && ed.endDate && "–"}{" "}
                  {ed.endDate}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 border-b border-neutral-100 pb-1">
            Proyectos Destacados
          </h2>
          <div className="space-y-3">
            {projects.map((proj: any, i: number) => (
              <div key={proj.id || i}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-neutral-800">
                    {proj.name}
                  </span>
                  {proj.date && (
                    <span className="text-xs text-neutral-400">
                      {proj.date}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-neutral-600 mt-0.5">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {(skills.length > 0 || softSkills.length > 0) && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 border-b border-neutral-100 pb-1">
            Habilidades
          </h2>
          {skills.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium text-neutral-700">
                Técnicas:{" "}
              </span>
              <span className="text-xs text-neutral-600">
                {skills.join(", ")}
              </span>
            </div>
          )}
          {softSkills.length > 0 && (
            <div>
              <span className="text-xs font-medium text-neutral-700">
                Blandas:{" "}
              </span>
              <span className="text-xs text-neutral-600">
                {softSkills.join(", ")}
              </span>
            </div>
          )}
        </section>
      )}

      {languages.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 border-b border-neutral-100 pb-1">
            Idiomas
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
            {languages.map((lang: any, i: number) => (
              <span key={lang.id || i}>
                <strong className="text-neutral-700">{lang.language}:</strong>{" "}
                {lang.level}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
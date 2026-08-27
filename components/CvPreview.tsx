import { Cv } from "@/lib/cv-schema";

export default function CvPreview({ cv }: { cv: Cv }) {
  const { personalInfo } = cv;

  return (
    <div className="bg-white text-neutral-900 shadow-sm border border-neutral-200 rounded-lg p-8 w-full max-w-[750px] mx-auto text-[13px] leading-relaxed">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">
          {personalInfo.fullName || "Tu nombre completo"}
        </h1>
        {personalInfo.headline && (
          <p className="text-neutral-600 mt-0.5">{personalInfo.headline}</p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-500 text-[12px] mt-1">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.github && <span>{personalInfo.github}</span>}
        </div>
      </header>

      {cv.summary && (
        <Section title="Resumen">
          <p>{cv.summary}</p>
        </Section>
      )}

      {cv.experience.length > 0 && (
        <Section title="Experiencia">
          {cv.experience.map((exp) => (
            <div key={exp.id} className="mb-3 last:mb-0">
              <div className="flex justify-between items-baseline">
                <p className="font-medium">
                  {exp.role} · {exp.company}
                </p>
                <p className="text-neutral-500 text-[12px] whitespace-nowrap ml-2">
                  {exp.startDate} — {exp.current ? "presente" : exp.endDate}
                </p>
              </div>
              {exp.location && (
                <p className="text-neutral-500 text-[12px]">{exp.location}</p>
              )}
              {exp.bullets.length > 0 && (
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  {exp.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.education.length > 0 && (
        <Section title="Educación">
          {cv.education.map((ed) => (
            <div key={ed.id} className="mb-2 last:mb-0">
              <div className="flex justify-between items-baseline">
                <p className="font-medium">{ed.institution}</p>
                <p className="text-neutral-500 text-[12px] whitespace-nowrap ml-2">
                  {ed.startDate} — {ed.endDate}
                </p>
              </div>
              <p>{ed.degree}</p>
              {ed.details && (
                <p className="text-neutral-500 text-[12px]">{ed.details}</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.projects.length > 0 && (
        <Section title="Proyectos personales">
          {cv.projects.map((p) => (
            <div key={p.id} className="mb-2 last:mb-0">
              <div className="flex justify-between items-baseline">
                <p className="font-medium italic">{p.name}</p>
                {p.date && (
                  <p className="text-neutral-500 text-[12px]">{p.date}</p>
                )}
              </div>
              {p.description && <p>{p.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {cv.skills.length > 0 && (
        <Section title="Habilidades técnicas">
          <p>{cv.skills.join(", ")}</p>
        </Section>
      )}

      {cv.softSkills.length > 0 && (
        <Section title="Habilidades blandas">
          <p>{cv.softSkills.join(", ")}</p>
        </Section>
      )}

      {cv.languages.length > 0 && (
        <Section title="Idiomas">
          <p>
            {cv.languages
              .map((l) => `${l.language}${l.level ? `: ${l.level}` : ""}`)
              .join(" · ")}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 last:mb-0">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide border-b border-neutral-200 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

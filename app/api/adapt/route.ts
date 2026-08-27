import { NextRequest, NextResponse } from "next/server";
import { CvSchema } from "@/lib/cv-schema";
import { adaptCvToJobPosting } from "@/lib/gemini";
import { cleanJobPostingText } from "@/lib/text-to-md";

export const runtime = "nodejs";

// LIMITE PROVISORIO, SOLO PARA DESARROLLO LOCAL.
// Esto vive en memoria del proceso: se resetea en cada reinicio del server
// y no funciona si corrés más de una instancia (serverless en Vercel, por
// ejemplo, crea instancias nuevas todo el tiempo). Antes de poner esto en
// producción, reemplazar por Upstash Redis con un contador por usuario/día,
// tal como se charló en el diseño original.
const DAILY_LIMIT = 15;
const usageByIp = new Map<string, { count: number; day: string }>();

function checkRateLimit(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const entry = usageByIp.get(ip);
  if (!entry || entry.day !== today) {
    usageByIp.set(ip, { count: 1, day: today });
    return true;
  }
  if (entry.count >= DAILY_LIMIT) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error:
          "Llegaste al límite de adaptaciones gratuitas de hoy. Probá de nuevo mañana.",
      },
      { status: 429 }
    );
  }

  const body = await req.json();
  const cvParsed = CvSchema.safeParse(body.baseCv);
  const jobPostingRaw = typeof body.jobPosting === "string" ? body.jobPosting : "";

  if (!cvParsed.success) {
    return NextResponse.json({ error: "CV base inválido." }, { status: 400 });
  }
  if (jobPostingRaw.trim().length < 30) {
    return NextResponse.json(
      { error: "Pegá el texto completo de la oferta laboral." },
      { status: 400 }
    );
  }

  const jobPostingMd = cleanJobPostingText(jobPostingRaw);

  try {
    const adapted = await adaptCvToJobPosting(cvParsed.data, jobPostingMd);
    const adaptedParsed = CvSchema.safeParse(adapted);
    if (!adaptedParsed.success) {
      return NextResponse.json(
        { error: "La IA devolvió un formato inesperado. Intentá de nuevo." },
        { status: 502 }
      );
    }
    return NextResponse.json({ cv: adaptedParsed.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

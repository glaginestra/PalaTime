import { NextRequest, NextResponse } from "next/server";
import { structureRawCvText } from "@/lib/gemini";
import { CvSchema } from "@/lib/cv-schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx");

  if (!isPdf && !isDocx) {
    return NextResponse.json(
      { error: "Formato no soportado. Subí un PDF o un Word (.docx)." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText = "";

  try {
    if (isPdf) {
      // pdf-parse: extracción de texto plano. Best-effort: en CVs con
      // columnas o diseño gráfico (ej. plantillas de Canva) el orden de
      // lectura puede salir mezclado. Por eso el resultado siempre se
      // muestra en el formulario para revisión antes de guardar, nunca
      // se asume 100% correcto.
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      rawText = parsed.text;
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    }
  } catch (err) {
    return NextResponse.json(
      { error: "No pudimos leer el archivo. Probá con otro PDF/Word o cargá los datos a mano." },
      { status: 422 }
    );
  }

  if (!rawText || rawText.trim().length < 20) {
    return NextResponse.json(
      { error: "El archivo parece estar vacío o es una imagen escaneada sin texto seleccionable." },
      { status: 422 }
    );
  }

  try {
    const structured = await structureRawCvText(rawText);
    const parsedCv = CvSchema.safeParse(structured);
    if (!parsedCv.success) {
      return NextResponse.json(
        { error: "La IA devolvió un formato inesperado. Intentá de nuevo o cargá los datos a mano." },
        { status: 502 }
      );
    }
    return NextResponse.json({ cv: parsedCv.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

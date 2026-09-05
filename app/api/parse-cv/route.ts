import { NextRequest, NextResponse } from "next/server";
import { structureRawCvText } from "@/lib/gemini";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = "";

    if (file.name.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      rawText = data.text;
    } else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
      const res = await mammoth.extractRawText({ buffer });
      rawText = res.value;
    } else {
      return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
    }

    const yamlResult = await structureRawCvText(rawText);

    return NextResponse.json({ yaml: yamlResult });
  } catch (error: any) {
    console.error("❌ Error en POST /api/parse-cv:", error);
    return NextResponse.json({ error: error.message || "Error procesando archivo" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const PYTHON_COMPILER_URL = process.env.NEXT_PUBLIC_PYTHON_COMPILER_URL || "http://127.0.0.1:8000/api/render";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const yamlContent = body.yaml_content || body.yaml;

    if (!yamlContent) {
      return NextResponse.json({ error: "No se proporcionó contenido YAML" }, { status: 400 });
    }

    const res = await fetch(PYTHON_COMPILER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yaml_content: yamlContent }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.detail || "Error en RenderCV Docker" }, { status: 500 });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="cv.pdf"',
      },
    });
  } catch (error: any) {
    console.error("Error conectando con RenderCV Docker:", error);
    return NextResponse.json({ error: "No se pudo conectar con el servicio RenderCV Docker" }, { status: 500 });
  }
}
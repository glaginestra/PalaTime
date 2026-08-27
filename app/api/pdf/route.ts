import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { CvSchema } from "@/lib/cv-schema";
import { CvPdfDocument } from "@/lib/cv-pdf-template";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CvSchema.safeParse(body.cv);

  if (!parsed.success) {
    return NextResponse.json({ error: "CV inválido" }, { status: 400 });
  }

  const buffer = await renderToBuffer(CvPdfDocument({ cv: parsed.data }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=cv.pdf",
    },
  });
}

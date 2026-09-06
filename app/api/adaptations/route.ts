import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const adaptations = await prisma.cvAdaptation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Mapeamos para que coincida con las propiedades que espera tu frontend (ej: title)
    const formatted = adaptations.map((item) => ({
      ...item,
      title: item.jobTitle,
      yamlContent: item.yamlResult,
    }));

    return NextResponse.json({ adaptations: formatted });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener las adaptaciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { jobTitle, company, jobPosting, yamlResult } = body;

    const newAdaptation = await prisma.cvAdaptation.create({
      data: {
        userId: session.user.id,
        jobTitle: jobTitle || "Adaptación sin título",
        company: company || "Empresa",
        jobPosting: jobPosting || "",
        yamlResult: yamlResult || "",
      },
    });

    return NextResponse.json({
      success: true,
      adaptation: {
        ...newAdaptation,
        title: newAdaptation.jobTitle,
        yamlContent: newAdaptation.yamlResult,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar la adaptación" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { jobTitle, title, yamlContent } = body;

    const adaptation = await prisma.cvAdaptation.findUnique({ where: { id } });
    if (!adaptation || adaptation.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const updateData: any = {};
    if (jobTitle || title) updateData.jobTitle = jobTitle || title;
    if (yamlContent) updateData.yamlResult = yamlContent;

    const updated = await prisma.cvAdaptation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      adaptation: {
        ...updated,
        title: updated.jobTitle,
        yamlContent: updated.yamlResult,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar la adaptación" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = params;

    const adaptation = await prisma.cvAdaptation.findUnique({ where: { id } });
    if (!adaptation || adaptation.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.cvAdaptation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar la adaptación" }, { status: 500 });
  }
}
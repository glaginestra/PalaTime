import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
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
    const { title, yamlContent } = body;

    const cv = await prisma.cv.findUnique({ where: { id } });
    if (!cv || cv.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (yamlContent) {
      updateData.yamlContent = encrypt(yamlContent);
    }

    const updatedCv = await prisma.cv.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      cv: {
        ...updatedCv,
        yamlContent: yamlContent || decrypt(updatedCv.yamlContent),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar el CV" }, { status: 500 });
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

    const cv = await prisma.cv.findUnique({ where: { id } });
    if (!cv || cv.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.cv.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar el CV" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
// Nota: Aquí deberás importar tu helper de sesión de Better Auth según cómo lo manejes
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const cvs = await prisma.cv.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    // Desciframos el contenido de cada CV antes de enviarlo al cliente
    const decryptedCvs = cvs.map(cv => ({
      ...cv,
      yamlContent: decrypt(cv.yamlContent),
    }));

    return NextResponse.json({ cvs: decryptedCvs });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener los CVs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, yamlContent } = body;

    if (!yamlContent) {
      return NextResponse.json({ error: "Contenido YAML vacío" }, { status: 400 });
    }

    // Ciframos los datos sensibles del CV antes de guardarlos en PostgreSQL
    const encryptedYaml = encrypt(yamlContent);

    const newCv = await prisma.cv.create({
      data: {
        userId: session.user.id,
        title: title || "Mi CV",
        yamlContent: encryptedYaml,
      },
    });

    return NextResponse.json({ 
      success: true, 
      cv: { ...newCv, yamlContent } // Devolvemos el original al cliente
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar el CV" }, { status: 500 });
  }
}
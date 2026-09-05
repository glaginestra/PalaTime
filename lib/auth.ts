import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma"; // Cambiado de "@/lib/prisma" a ruta relativa

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 días
        updateAge: 60 * 60 * 24,       // Renueva la sesión si hay actividad después de 1 día
    },
});
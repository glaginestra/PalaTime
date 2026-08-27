import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiCvResponseSchema } from "./cv-schema";

// GEMINI_API_KEY se toma de las variables de entorno (.env.local).
// Nunca la expongas en el cliente: esta función solo debe llamarse
// desde API routes (server-side).
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta GEMINI_API_KEY en las variables de entorno. Copiá .env.example a .env.local y completá tu key de https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

// Modelo barato/rápido, suficiente para reescribir texto (no necesita
// razonamiento pesado). Ver conversación previa: Flash / Flash-Lite tiene
// tier gratuito generoso y es la opción recomendada para esta tarea.
const MODEL_NAME = "gemini-3.6-flash";

export async function structureRawCvText(rawText: string) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: geminiCvResponseSchema as any,
    },
  });

  const prompt = `Sos un asistente que convierte el texto crudo de un CV (extraído de un PDF o Word,
puede venir con el orden desordenado) en una estructura JSON. Reglas estrictas:
- No inventes información que no esté en el texto.
- Si un campo no aparece, dejalo vacío o como array vacío.
- Generá un "id" único y corto (letras/números) para cada item de experience, education,
  projects y languages.
- No agregues comentarios ni texto fuera del JSON.

Texto del CV:
"""
${rawText}
"""`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

export async function adaptCvToJobPosting(baseCv: unknown, jobPostingMarkdown: string) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: geminiCvResponseSchema as any,
    },
  });

  const prompt = `Sos un asistente experto en redacción de CVs y en optimización para sistemas ATS.
Vas a recibir un CV base en JSON y una oferta laboral en Markdown. Tu tarea es adaptar el CV
a esa oferta específica. Reglas estrictas, muy importantes:
- NUNCA inventes experiencia, empresas, fechas, títulos o habilidades que no estén en el CV base.
- Podés reordenar la experiencia y los bullets para priorizar lo más relevante a la oferta.
- Podés reescribir el resumen y los bullets para usar palabras clave que aparezcan en la oferta,
  siempre que reflejen algo que realmente está en el CV base.
- Podés reordenar o resaltar las habilidades técnicas que coincidan con la oferta, pero no agregar
  habilidades nuevas que el candidato no puso en su CV base.
- Mantené los mismos "id" de cada item cuando no lo elimines.
- Devolvé el CV completo en la misma estructura JSON, no solo lo que cambiaste.

CV base (JSON):
"""
${JSON.stringify(baseCv)}
"""

Oferta laboral (Markdown):
"""
${jobPostingMarkdown}
"""`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

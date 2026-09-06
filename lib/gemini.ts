import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as yaml from "js-yaml";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

// Array con las API Keys de Gemini configuradas dinámicamente
const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

// const OPENROURAL_API_KEY = process.env.OPENROUTER_API_KEY; // Descomentar Para poder osar OpenRoute para fallback

function cleanInput(text: string): string {
  return text
    .replace(/[\uE000-\uF8FF]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/([a-zÁÉÍÓÚÑáéíóúñ])([A-ZÁÉÍÓÚÑ])/g, "$1 $2")
    .trim();
}

function sanitizeDate(dateStr: any, fallback: string, isEndDate: boolean = false): string {
  if (!dateStr || typeof dateStr !== "string") return fallback;
  const cleaned = dateStr.trim().toLowerCase();

  if (/presente|actual|actualmente|present/i.test(cleaned)) {
    return isEndDate ? "present" : fallback;
  }
  if (cleaned.length > 25) return fallback;

  const isoMatch = cleaned.match(/\b(19|20)\d{2}-(0[1-9]|1[0-2])\b/);
  if (isoMatch) return isoMatch[0];

  const monthMap: Record<string, string> = {
    ene: "01", enero: "01", jan: "01", january: "01",
    feb: "02", febrero: "02", february: "02",
    mar: "03", marzo: "03", march: "03",
    abr: "04", abril: "04", apr: "04", april: "04",
    may: "05", mayo: "05",
    jun: "06", junio: "06", june: "06",
    jul: "07", julio: "07", july: "07",
    ago: "08", agosto: "08", aug: "08", august: "08",
    sep: "09", septiembre: "09", sept: "09", september: "09",
    oct: "10", octubre: "10", october: "10",
    nov: "11", noviembre: "11", november: "11",
    dic: "12", diciembre: "12", dec: "12", december: "12"
  };

  const textMonthMatch = cleaned.match(/([a-z]{3,10})\.?\s*(\d{4})/i);
  if (textMonthMatch) {
    const month = monthMap[textMonthMatch[1].toLowerCase()];
    const year = textMonthMatch[2];
    if (month && year) return `${year}-${month}`;
  }

  const numMonthMatch = cleaned.match(/\b(0?[1-9]|1[0-2])[\/.-](\d{4})\b/);
  if (numMonthMatch) {
    const month = numMonthMatch[1].padStart(2, "0");
    const year = numMonthMatch[2];
    return `${year}-${month}`;
  }

  const yearOnlyMatch = cleaned.match(/\b(19|20)\d{2}\b/);
  if (yearOnlyMatch) {
    return yearOnlyMatch[0];
  }

  return fallback;
}

function inferCountryCode(locationStr: string): CountryCode | undefined {
  if (!locationStr) return undefined;
  const loc = locationStr.toLowerCase();

  if (loc.includes("colombia") || loc.includes("medellín") || loc.includes("bogotá")) return "CO";
  if (loc.includes("argentina") || loc.includes("buenos aires") || loc.includes("caba")) return "AR";
  if (loc.includes("españa") || loc.includes("spain") || loc.includes("madrid") || loc.includes("barcelona")) return "ES";
  if (loc.includes("méxico") || loc.includes("mexico") || loc.includes("cdmx")) return "MX";
  if (loc.includes("chile") || loc.includes("santiago")) return "CL";
  if (loc.includes("perú") || loc.includes("peru") || loc.includes("lima")) return "PE";
  if (loc.includes("uruguay") || loc.includes("montevideo")) return "UY";
  if (loc.includes("venezuela") || loc.includes("caracas")) return "VE";
  if (loc.includes("ecuador") || loc.includes("quito")) return "EC";
  if (loc.includes("usa") || loc.includes("united states") || loc.includes("estados unidos")) return "US";

  return undefined;
}

function sanitizePhone(phoneStr: string, locationStr: string = ""): string {
  if (!phoneStr) return "";

  let cleanPhone = phoneStr.trim();
  const countryCode = inferCountryCode(locationStr);

  const countryPrefixes: Partial<Record<CountryCode, string>> = {
    AR: "+549",
    CO: "+57",
    ES: "+34",
    MX: "+52",
    CL: "+56",
    PE: "+51",
    UY: "+598",
    VE: "+58",
    EC: "+593",
    US: "+1",
  };

  try {
    const defaultCountry = countryCode || "AR";
    const phoneNumber = parsePhoneNumberFromString(cleanPhone, defaultCountry);

    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format("E.164");
    }
  } catch (e) {}

  let digits = cleanPhone.replace(/[^\d+]/g, "");

  if (!digits.startsWith("+") && countryCode && countryPrefixes[countryCode]) {
    const prefix = countryPrefixes[countryCode];
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    digits = prefix + digits;
  }

  if (digits.length < 7) return "";
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function sanitizeWebsite(urlStr: string, textContext: string = ""): string {
  const matchInUrl = urlStr?.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9._-]+\.[a-zA-Z]{2,10})/i);
  if (matchInUrl) {
    const domain = matchInUrl[0].replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    return `https://www.${domain.replace(/^www\./i, "")}`;
  }

  const matchInText = textContext.match(/(?:Web:\s*|sitio:\s*|portfolio:\s*|https?:\/\/)?(www\.[a-zA-Z0-9._-]+\.[a-zA-Z]{2,10})/i);
  if (matchInText) {
    return `https://${matchInText[1]}`;
  }

  return "";
}

function toCapitalTitle(str: string): string {
  const wordsToKeepLower = new Set(["de", "del", "y", "en", "para", "con", "a", "sobre", "por", "un", "una"]);
  const words = str.trim().toLowerCase().split(/\s+/);

  return words
    .map((word, index) => {
      if (index > 0 && wordsToKeepLower.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function extractBasicData(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i);
  const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,4}[-.\s]?\d{6,12}/);

  let name = "";
  for (const line of lines) {
    if (line.length < 50 && !/\d/.test(line) && !line.includes("@") && !line.includes(".")) {
      name = line;
      break;
    }
  }

  return {
    name: name || "Candidato",
    email: emailMatch ? emailMatch[0] : "",
    rawPhone: phoneMatch ? phoneMatch[0] : "",
  };
}

function getSectionPriority(title: string): number {
  const t = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (t.includes("perfil") || t.includes("resumen") || t.includes("summary") || t.includes("acerca") || t.includes("sobre mi") || t.includes("about")) return 1;
  if (t.includes("experiencia") || t.includes("trayectoria") || t.includes("empleo") || t.includes("trabajo") || t.includes("experience") || t.includes("historial laboral")) return 2;
  if (t.includes("educaci") || t.includes("formaci") || t.includes("estudio") || t.includes("academic") || t.includes("education")) return 3;
  if (t.includes("proyecto") || t.includes("obra") || t.includes("portafolio") || t.includes("portfolio") || t.includes("project")) return 4;
  return 5;
}

const cvSchemaObject = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: "Nombre completo del candidato" },
    headline: { type: SchemaType.STRING, description: "Subtítulo, rol actual o especialidad" },
    location: { type: SchemaType.STRING, description: "Ubicación si está disponible" },
    email: { type: SchemaType.STRING, description: "Correo electrónico" },
    phone: { type: SchemaType.STRING, description: "Teléfono" },
    website: { type: SchemaType.STRING, description: "Sitio web o portafolio" },
    linkedin_username: { type: SchemaType.STRING, description: "Usuario de LinkedIn" },
    github_username: { type: SchemaType.STRING, description: "Usuario de GitHub" },
    sections_dynamic: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "Título exacto de la sección tal como aparece en el CV" },
          type: { type: SchemaType.STRING, description: "Debe ser estrictamente uno de: dated_entries, project_entries, labeled_entries, text_entries" },
          dated_entries: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                institution: { type: SchemaType.STRING, description: "Empresa, universidad u organización" },
                area: { type: SchemaType.STRING, description: "Puesto, rol, título académico o diplomado obtenido" },
                start_date: { type: SchemaType.STRING },
                end_date: { type: SchemaType.STRING },
                highlights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
            },
          },
          project_entries: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                summary: { type: SchemaType.STRING },
              },
            },
          },
          labeled_entries: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                label: { type: SchemaType.STRING, description: "Category (e.g. Languages, Tools)" },
                details: { type: SchemaType.STRING, description: "Associated details" },
              },
            },
          },
          text_entries: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["title", "type"],
      },
    },
  },
  required: ["name", "sections_dynamic"],
};

async function callGeminiWithKey(cleanedText: string, apiKey: string): Promise<any> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: cvSchemaObject,
      temperature: 0,
      maxOutputTokens: 8192,
    },
  });

  const prompt = `Actúa como un motor de parsing de currículum vitae altamente flexible y avanzado. Analiza el texto plano provisto de un CV (que puede tener un formato desordenado, multi-columna o mal exportado) y extrae la información estructurándola en el JSON requerido.

INSTRUCCIONES DE ADAPTABILIDAD UNIVERSAL:
1. **Detección de Secciones**: Respeta y extrae los títulos de las secciones tal como los nombra el candidato (ej: "Experiencia", "Trayectoria", "Historial Académico", "Cursos", "Habilidades", "Idiomas", etc.).
2. **Mapeo Inteligente de Entradas con Fechas ('dated_entries')**: Cualquier bloque que tenga una organización y un rol/título/estudio acompañado de fechas (laborales, educativas o cursos) debe ir obligatoriamente en este tipo. Si el diseño del CV invierte el orden (pone primero el puesto y después la empresa, o viceversa), usa tu criterio semántico para mapear correctamente 'institution' (empresa/universidad) y 'area' (puesto/título). Extrae las fechas fielmente del texto sin inventar meses por defecto.
3. **Bloques mal pegados**: Si notas que el texto crudo del PDF unió dos palabras o secciones por falta de espacios (ej: un título pegado a una universidad), usa contexto semántico para separarlas mentalmente y asignarlas a sus campos correctos sin perder datos.
4. **Habilidades e Idiomas ('labeled_entries')**: Agrupa las tecnologías, habilidades blandas o idiomas bajo el formato clave-valor (ej. label: "Idiomas", details: "Español: nativo, Inglés: C1").
5. **Fidelidad Absoluta**: No inventes datos que no estén en el texto. Si un campo opcional no existe, déjalo vacío.
CV A PROCESAR:
"""
${cleanedText}
"""`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text() || "{}");
}

/* ==========================================================================
   SECCIÓN DE OPENROUTER (COMENTADA PARA DESARROLLO / LISTA PARA PRODUCCIÓN)
   ==========================================================================

// 🔹 Función de post-procesamiento exclusiva para corregir artefactos de OpenRouter
function sanitizeOpenRouterOutput(extractedData: any): any {
  if (!extractedData) return extractedData;

  const fixSpacing = (str: string): string => {
    if (typeof str !== "string") return str;
    return str
      .replace(/([ÁÉÍÓÚÑáéíóúñ])\s+([A-ZÑa-zñ])/g, "$1$2")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  if (extractedData.name) extractedData.name = fixSpacing(extractedData.name);
  if (extractedData.headline) extractedData.headline = fixSpacing(extractedData.headline);
  if (extractedData.location) extractedData.location = fixSpacing(extractedData.location);

  if (Array.isArray(extractedData.sections_dynamic)) {
    extractedData.sections_dynamic = extractedData.sections_dynamic.map((sec: any) => {
      if (sec.title) sec.title = fixSpacing(sec.title);

      if (Array.isArray(sec.dated_entries)) {
        sec.dated_entries = sec.dated_entries.map((item: any) => {
          if (item.institution) item.institution = fixSpacing(item.institution);
          if (item.area) item.area = fixSpacing(item.area);
          if (Array.isArray(item.highlights)) {
            item.highlights = item.highlights.map((h: string) => fixSpacing(h));
          }
          return item;
        });
      }

      if (Array.isArray(sec.labeled_entries)) {
        sec.labeled_entries = sec.labeled_entries.map((item: any) => {
          if (item.label) item.label = fixSpacing(item.label);
          if (item.details) item.details = fixSpacing(item.details);
          return item;
        });
      }

      return sec;
    });
  }

  return extractedData;
}

async function callOpenRouterFallback(cleanedText: string): Promise<any> {
  console.log("🔄 Todas las API Keys de Gemini fallaron o se agotaron. Redirigiendo a OpenRouter...");

  if (!OPENROUTER_API_KEY) {
    throw new Error("No hay API Key de OpenRouter configurada.");
  }

  const prompt = `Actúa como un motor experto de parsing de currículum vitae. Analiza el texto plano provisto (que puede tener un diseño caótico o desordenado) y extrae la información estructurándola rigurosamente en el JSON requerido.

ESTRUCTURA JSON REQUERIDA:
{
  "name": "Nombre completo del candidato",
  "headline": "Subtítulo, rol actual o especialidad",
  "location": "Ubicación si está disponible",
  "email": "Correo electrónico",
  "phone": "Teléfono",
  "website": "Sitio web o portafolio",
  "linkedin_username": "Usuario de LinkedIn",
  "github_username": "Usuario de GitHub",
  "sections_dynamic": [
    {
      "title": "Título exacto de la sección tal como la nombra el candidato en el CV (ej: 'Experiencia', 'Trayectoria', 'Educación', 'Proyectos', 'Cursos', etc.)",
      "type": "dated_entries | project_entries | labeled_entries | text_entries",
      "dated_entries": [
        { "institution": "Nombre de la empresa, institución o universidad", "area": "Puesto, rol o título obtenido", "start_date": "YYYY-MM o YYYY", "end_date": "YYYY-MM, YYYY o present", "highlights": ["detalles"] }
      ],
      "project_entries": [
        { "name": "Nombre del proyecto", "summary": "Resumen" }
      ],
      "labeled_entries": [
        { "label": "Categoría (ej: Idiomas, Lenguajes, Herramientas)", "details": "Valores asociados" }
      ],
      "text_entries": ["Texto libre (ej: Perfil, Resumen)"]
    }
  ]
}

INSTRUCCIONES CLAVE DE FLEXIBILIDAD Y CALIDAD:
1. **Preservación de Títulos Originales**: Respeta y extrae el título de la sección tal cual lo escribió el candidato.
2. **Selección del 'type' correcto**: 
   - Usa 'dated_entries' para Experiencia, Educación o Cursos con fechas.
   - Usa 'project_entries' para Proyectos Personales.
   - Usa 'labeled_entries' para Habilidades o Idiomas.
   - Usa 'text_entries' para Perfil o Resumen.
3. **Prohibido crear secciones por empresa**: NUNCA uses el nombre individual de una empresa o universidad como título de sección.
4. **Fechas y Fidelidad**: Extrae las fechas fielmente sin inventar meses.

CV A PROCESAR:
"""
${cleanedText}
"""`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://tu-proyecto.vercel.app",
      "X-Title": "CV Parser App",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Fallo en la llamada a OpenRouter: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || "{}";
  
  */

  //content = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();

/*  const parsedJson = JSON.parse(content);
  return sanitizeOpenRouterOutput(parsedJson);
}
==========================================================================*/

export async function structureRawCvText(rawText: string): Promise<string> {
  const cleaned = cleanInput(rawText);
  const basic = extractBasicData(cleaned);

  console.log("\n==================================================");
  console.log(`⚡ [PARSER CON FALLBACK: GEMINI KEYS] (${cleaned.length} caracteres)`);
  console.log("--------------------------------------------------");

  const startTime = Date.now();
  let extractedData: any = {};
  let success = false;

  if (geminiKeys.length === 0) {
    console.warn("⚠️ No se encontraron API Keys de Gemini configuradas.");
  }

  // 1. Bucle en cascada a través de las API Keys de Gemini
  for (let i = 0; i < geminiKeys.length; i++) {
    try {
      console.log(`⚡ Intentando con Gemini API Key #${i + 1}...`);
      extractedData = await callGeminiWithKey(cleaned, geminiKeys[i]);
      success = true;
      console.log(`✅ ¡Éxito utilizando la API Key #${i + 1} de Gemini!`);
      break;
    } catch (e: any) {
      console.warn(`⚠️ API Key #${i + 1} falló (${e?.message || e}). Probando siguiente clave...`);
    }
  }

  /* 
    2. FALLBACK A OPENROUTER (Descomentar en producción cuando se agoten las de Gemini)
    if (!success) {
      try {
        console.log("⚠️ Todas las API Keys de Gemini se agotaron o fallaron. Activando OpenRouter...");
        extractedData = await callOpenRouterFallback(cleaned);
        success = true;
      } catch (routerErr: any) {
        console.error(`❌ OpenRouter también falló: ${routerErr?.message || routerErr}`);
        throw new Error("No se pudo procesar el CV con ninguna de las opciones disponibles.");
      }
    }
  */

  if (!success) {
    throw new Error("No se pudo procesar el CV con ninguna de las API Keys de Gemini disponibles.");
  }

  console.log(`⏱️ Procesado con éxito en ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

  const rawLoc = (extractedData.location || "").trim();
  const hasValidLocation = rawLoc.length > 0 && !/ciudad,?\s*pa[ií]s|not specified|no especificado|n\/?a/i.test(rawLoc);
  const userLocation = hasValidLocation ? rawLoc : "";

  const userPhone = extractedData.phone || basic.rawPhone;
  const formattedPhone = sanitizePhone(userPhone, userLocation);
  const cleanWeb = sanitizeWebsite(extractedData.website, cleaned);

  const socialNetworks: any[] = [];
  if (extractedData.linkedin_username && typeof extractedData.linkedin_username === "string") {
    const li = extractedData.linkedin_username.trim();
    if (li && !li.includes("@") && !/n\/?a|none|null/i.test(li)) {
      socialNetworks.push({ network: "LinkedIn", username: li });
    }
  }

  if (extractedData.github_username && typeof extractedData.github_username === "string") {
    const gh = extractedData.github_username.trim();
    if (gh && !gh.includes("@") && !/n\/?a|none|null/i.test(gh)) {
      socialNetworks.push({ network: "GitHub", username: gh });
    }
  }

  const rawSections = Array.isArray(extractedData.sections_dynamic) ? extractedData.sections_dynamic : [];
  const processedSections: Array<{ title: string; data: any; priority: number }> = [];

  for (const sec of rawSections) {
    let rawTitle = (sec.title || "").trim();
    if (!rawTitle) continue;

    const formattedTitle = toCapitalTitle(rawTitle);

    if (sec.type === "dated_entries" && Array.isArray(sec.dated_entries) && sec.dated_entries.length > 0) {
      const cleanDated = sec.dated_entries
        .filter((item: any) => item.institution || item.area)
        .map((item: any) => {
          let startDate = sanitizeDate(item.start_date, "", false);
          let endDate = sanitizeDate(item.end_date, "", true);

          if (startDate && endDate && startDate === endDate) {
            endDate = startDate;
            startDate = "";
          } else if (startDate && !endDate && item.end_date === undefined) {
            endDate = startDate;
            startDate = "";
          }

          if (startDate && endDate && startDate !== "present" && endDate !== "present" && startDate > endDate) {
            const [startYear, startMonth] = startDate.split("-").map(Number);
            const [endYear, endMonth] = endDate.split("-").map(Number);

            if (startYear === endYear && startMonth > endMonth) {
              const correctedYear = startYear - 1;
              startDate = `${correctedYear}-${String(startMonth).padStart(2, "0")}`;
            }
          }

          const entry: any = {
            institution: item.institution || "Institución",
            area: item.area || "Título / Rol",
          };

          if (startDate) entry.start_date = startDate;
          if (endDate) entry.end_date = endDate;

          if (Array.isArray(item.highlights) && item.highlights.length > 0) {
            entry.highlights = item.highlights;
          }

          return entry;
        });

      if (cleanDated.length > 0) {
        processedSections.push({ title: formattedTitle, data: cleanDated, priority: getSectionPriority(formattedTitle) });
      }
    }
    else if (sec.type === "project_entries" && Array.isArray(sec.project_entries) && sec.project_entries.length > 0) {
      const cleanProjects = sec.project_entries
        .filter((item: any) => item.name)
        .map((item: any) => ({
          name: item.name,
          summary: item.summary || "",
        }));

      if (cleanProjects.length > 0) {
        processedSections.push({ title: formattedTitle, data: cleanProjects, priority: getSectionPriority(formattedTitle) });
      }
    }
    else if (sec.type === "labeled_entries" && Array.isArray(sec.labeled_entries) && sec.labeled_entries.length > 0) {
      const cleanLabeled = sec.labeled_entries
        .filter((item: any) => item.label && item.details)
        .map((item: any) => ({
          label: item.label,
          details: typeof item.details === "string" ? item.details : Array.isArray(item.details) ? item.details.join(", ") : "",
        }));

      if (cleanLabeled.length > 0) {
        processedSections.push({ title: formattedTitle, data: cleanLabeled, priority: getSectionPriority(formattedTitle) });
      }
    }
    else if (sec.type === "text_entries" && Array.isArray(sec.text_entries) && sec.text_entries.length > 0) {
      const cleanText = sec.text_entries.filter((item: any) => typeof item === "string" && item.trim().length > 0);
      if (cleanText.length > 0) {
        processedSections.push({ title: formattedTitle, data: cleanText, priority: getSectionPriority(formattedTitle) });
      }
    }
  }

  processedSections.sort((a, b) => a.priority - b.priority);

  const sortedSectionsObject: Record<string, any> = {};
  for (const s of processedSections) {
    sortedSectionsObject[s.title] = s.data;
  }

  const renderCvStructure = {
    cv: {
      name: extractedData.name || basic.name,
      ...(extractedData.headline ? { headline: extractedData.headline } : {}),
      ...(userLocation ? { location: userLocation } : {}),
      email: extractedData.email || basic.email,
      ...(formattedPhone ? { phone: formattedPhone } : {}),
      ...(cleanWeb ? { website: cleanWeb } : {}),
      ...(socialNetworks.length > 0 ? { social_networks: socialNetworks } : {}),
      sections: sortedSectionsObject,
    },
    design: { theme: "classic" },
    locale: { language: "spanish" },
    settings: {
      current_date: "today",
      pdf_title: `${extractedData.name || basic.name} - CV`,
    },
  };

  const finalYaml = yaml.dump(renderCvStructure, { indent: 2, lineWidth: -1 });
  console.log("✅ [YAML GENERADO CON ÉXITO]:\n", finalYaml);
  return finalYaml;
}

export async function adaptCvToJobPosting(baseCv: any, jobPostingMd: string): Promise<any> {
  if (geminiKeys.length === 0) {
    throw new Error("No hay API Keys de Gemini configuradas para la adaptación.");
  }

  const genAI = new GoogleGenerativeAI(geminiKeys[0]);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  });

  const prompt = `Actúa como un reclutador técnico experto y un ATS (Applicant Tracking System). Tu objetivo es adaptar el CV base provisto para alinear los logros reales del candidato con los requisitos de la oferta laboral.

REGLAS ESTRICTAS:
1. **PROHIBIDO INVENTAR**: No inventes experiencias, empresas, títulos ni tecnologías que no existan en el CV base. Todo debe basarse estrictamente en la información original.
2. **OPTIMIZACIÓN DE KEYWORDS**: Inyecta y resalta orgánicamente las palabras clave de la oferta dentro de las habilidades y los bullet points, siempre que el candidato demuestre poseerlas.
3. **PRESERVACIÓN DINÁMICA DE ESQUEMA**: Debes devolver un objeto JSON que mantenga **exactamente las mismas claves, jerarquía y estructura de datos** que el objeto JSON del CV base provisto a continuación. No elimines secciones principales ni alteres los nombres de las propiedades raíz.

CV BASE DEL CANDIDATO (TEMPLATE DE REFERENCIA):
"""
${JSON.stringify(baseCv, null, 2)}
"""

OFERTA LABORAL OBJETIVO:
"""
${jobPostingMd}
"""`;

  const result = await model.generateContent(prompt);
  const textResponse = result.response.text() || "{}";
  
  return JSON.parse(textResponse);
}
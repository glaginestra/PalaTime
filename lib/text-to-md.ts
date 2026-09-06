export function cleanJobPostingText(rawText: string): string {
  if (!rawText) return "";

  // 1. Normalizar saltos de línea y limpiar caracteres de control ocultos
  let normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/[\uE000-\uF8FF]/g, "");

  // 2. Eliminar globalmente cualquier emoji o pictograma usando Unicode estándar
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  normalized = normalized.replace(emojiRegex, "");

  // 3. Palabras clave que indican secciones irrelevantes
  const unwantedKeywords = [
    "sobre la empresa", "acerca de nosotros", "about us", "company description",
    "beneficios", "ofrecemos", "lo que ofrecemos", "perks", "we offer", 
    "why join us", "compensación", "compensacion", "te ofrecemos"
  ];

  // Palabras clave que indican que una sección es un requisito o información útil que SIEMPRE debemos conservar
  const keepKeywords = [
    "necesitamos", "requisitos", "responsabilidades", "perfil", "experiencia",
    "skills", "requirements", "buscamos", "acerca del empleo"
  ];

  const lines = normalized.split("\n");
  const filteredLines: string[] = [];
  
  let skipBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Verificamos si esta línea introduce una sección prohibida (beneficios o empresa)
    const isUnwantedTrigger = unwantedKeywords.some(kw => lower.includes(kw));

    if (isUnwantedTrigger) {
      skipBlock = true;
      continue; // Omitimos el título del beneficio
    }

    // Si estamos dentro del bloque prohibido, evaluamos si ya llegamos a una sección que debemos conservar
    if (skipBlock) {
      const isRescueTrigger = keepKeywords.some(kw => lower.includes(kw));
      if (isRescueTrigger) {
        skipBlock = false; // ¡Rescatado! Salimos del modo de exclusión y procesamos esta línea normalmente
      } else {
        continue; // Seguimos descartando todas las viñetas de beneficios (Wellhub, prepaga, etc.)
      }
    }

    filteredLines.push(line);
  }

  // 4. Limpieza final de espacios múltiples y saltos vacíos excesivos
  return filteredLines
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
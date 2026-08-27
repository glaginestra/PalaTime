// Conversión liviana de texto plano/HTML pegado a algo más compacto tipo
// Markdown, para no mandarle a Gemini espacios y tags innecesarios. No es
// un parser HTML completo: es una limpieza suficiente para este caso de uso.
export function cleanJobPostingText(raw: string): string {
  let text = raw;

  // Si viene con tags HTML (pegado desde un navegador), los saca.
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<li[^>]*>/gi, "\n- ");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<[^>]+>/g, "");

  // Colapsa espacios y líneas repetidas.
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

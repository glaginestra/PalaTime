# PalaTime — MVP

Adapta tu CV a cada oferta con IA. Este es el esqueleto funcional de la Fase 1
que definimos: crear/importar CV, editarlo con preview en vivo, adaptarlo a
una oferta con Gemini, y descargarlo en PDF.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
```

Completá `GEMINI_API_KEY` en `.env.local` con una key gratuita de
[Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm run dev
```

Abrí `http://localhost:3000`.

## Qué incluye este MVP

- **Home** con las tres opciones (crear, subir, adaptar). "Adaptar" sin CV
  base muestra el aviso y redirige a crear/subir en vez de romperse.
- **Crear CV**: formulario largo con preview fijo a la derecha.
- **Subir CV**: acepta PDF y Word (.docx), extrae el texto y usa Gemini para
  estructurarlo en el mismo schema — siempre queda en revisión manual antes
  de guardar, porque el parseo de PDFs con diseño gráfico no es confiable.
- **Pantalla principal** (`/cv`): sidebar con crear/subir/adaptar + lista de
  CVs (base y adaptaciones), toggle "Amigable / JSON" para editar, preview a
  la derecha, botón de descarga a PDF.
- **Adaptar**: pega la oferta, la limpia a un formato liviano antes de
  mandarla a Gemini (ahorra tokens), y genera una nueva versión sin inventar
  experiencia que no esté en el CV base.
- El primer CV creado o importado queda automáticamente como CV base
  (`lib/cv-storage.ts`).

## Lo que falta a propósito (Fase 2 y 3 — no está en este MVP)

Esto es intencional, para no inflar el scope antes de validar lo esencial:

1. **Auth + base de datos real.** Hoy el CV base y las adaptaciones viven en
   `localStorage` del navegador (ver `lib/cv-storage.ts`) — se pierden si
   cambiás de dispositivo o borrás el caché. El próximo paso es reemplazar
   esas funciones por llamadas a una API respaldada por Postgres (Supabase o
   Neon), manteniendo la misma interfaz para no tocar los componentes.
2. **Rate limit real.** El límite de 15 adaptaciones/día en
   `app/api/adapt/route.ts` vive en memoria del proceso — se resetea al
   reiniciar el server y no sirve con múltiples instancias serverless.
   Reemplazar por Upstash Redis con contador por usuario antes de compartir
   el link públicamente.
3. **Onboarding con tooltips.** Las capturas de RenderCV que usamos de
   referencia no tienen opción de "omitir" — sumarla en la versión final,
   a diferencia de la referencia.
4. **Templates múltiples.** Hoy hay un solo diseño de CV
   (`components/CvPreview.tsx` y `lib/cv-pdf-template.tsx`). Sumar 2-3 más
   una vez que el flujo principal esté validado.
5. **Extracción de puesto/empresa de la oferta.** Hoy se adivina con una
   heurística simple (primera línea del texto pegado) y el usuario la puede
   corregir a mano antes de adaptar — no hay una llamada extra a la IA para
   esto, para no gastar cuota de más.

## Estructura

```
app/
  page.tsx            → home
  crear/page.tsx       → formulario + preview (crear e importar)
  cv/page.tsx           → pantalla principal (estilo RenderCV)
  adaptar/page.tsx     → pegar oferta y adaptar
  api/
    parse-cv/route.ts  → extrae texto de PDF/Word y lo estructura
    adapt/route.ts     → adapta el CV base a una oferta
    pdf/route.ts       → genera el PDF final
lib/
  cv-schema.ts         → la fuente de verdad de la estructura del CV (Zod)
  cv-storage.ts        → persistencia (hoy localStorage, mañana DB)
  gemini.ts            → wrapper del cliente de Gemini
  cv-pdf-template.tsx  → template para @react-pdf/renderer
  text-to-md.ts        → limpieza de la oferta antes de mandarla a la IA
components/
  CvForm.tsx           → formulario editable, se reusa en crear y en /cv
  CvPreview.tsx         → preview HTML del CV
```

const { cleanJobPostingText } = require("./lib/text-to-md");

const ofertaEjemplo = `
Acerca del empleo
¿Quiénes somos?

Somos la empresa de tecnología y negocios más prestigiosa de Iberoamérica. Nuestra red regional permite responder rápidamente a la demanda, con especialistas en cada problemática y aplicando innovación tecnológica a cada negocio.


📢 ¿Qué buscamos?
Nos encontramos en la búsqueda de Desarrolladores Full Stack para trabajar en proyectos de la industria Petrolera y Financiera, principalmente.

¿Qué necesitamos? 💪
    Acceder a esquema de presencialidad de 4x1 (Excluyente)
    Desarrollo y mantenimiento de aplicaciones Web y Mobile alojadas en Azure.
    Análisis y resolución de incidentes.
    Participación en tareas evolutivas y correctivas.
    Experiencia en tecnologías web y arquitecturas empresariales.
    Experiencia en implementación y despliegues en soluciones web en contendedores (Open Shift)
    Conocimientos de tecnologías: React, .Net , Flutter, APIs, bases de datos SQL, relacionales y servicios Azure, utilizadas dentro del ecosistema Microsoft y Azure.

♥¿Qué beneficios te ofrecemos?

🏥 Cobertura de salud para vos.
🤩 Días de licencia personal para usar como más te guste, vacaciones en días hábiles y otras licencias extendidas

🏋️ Tarifas preferenciales en Wellhub (ex Gympass)

📖 Descuentos en Clases de Idiomas con Importante Institución Líder en Educación.

💻 Udemy Business 100% bonificado.
🎓 Convenios con Universidades y descuentos en Instituciones Educativas.

🫂 Programa de Asistencia al Empleado: asesoría psicológica, legal, financiera-contable y nutricional.

🛒 Acceso exclusivo a Plataformas E-Commerce para compras de productos de supermercado y tecnología con grandes descuentos.

🎁 Kit de Bienvenida + Regalo por nacimiento.🐻 Bimbo en la oficina: acceso a sus productos con grandes descuentos.

📣 Red de beneficios y descuentos.🙌

    Y muchos más...

`;

console.log("=== ANTES ===");
console.log(ofertaEjemplo);

console.log("\n=== DESPUÉS DE LA LIMPIEZA ===");
console.log(cleanJobPostingText(ofertaEjemplo));
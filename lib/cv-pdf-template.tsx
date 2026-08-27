import { Cv } from "./cv-schema";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  headline: { color: "#525252", marginBottom: 4 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, color: "#737373", fontSize: 9, marginBottom: 12 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 3,
    marginBottom: 6,
  },
  section: { marginBottom: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between" },
  itemTitle: { fontWeight: 700 },
  itemMeta: { color: "#737373", fontSize: 9 },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletDot: { width: 8 },
  bulletText: { flex: 1 },
});

export function CvPdfDocument({ cv }: { cv: Cv }) {
  const { personalInfo } = cv;
  const meta = [
    personalInfo.location,
    personalInfo.email,
    personalInfo.phone,
    personalInfo.website,
    personalInfo.linkedin,
    personalInfo.github,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{personalInfo.fullName}</Text>
        {personalInfo.headline ? (
          <Text style={styles.headline}>{personalInfo.headline}</Text>
        ) : null}
        {meta.length > 0 ? (
          <View style={styles.metaRow}>
            {meta.map((m, i) => (
              <Text key={i}>{m}</Text>
            ))}
          </View>
        ) : null}

        {cv.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <Text>{cv.summary}</Text>
          </View>
        ) : null}

        {cv.experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experiencia</Text>
            {cv.experience.map((exp) => (
              <View key={exp.id} style={{ marginBottom: 8 }}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>
                    {exp.role} · {exp.company}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {exp.startDate} — {exp.current ? "presente" : exp.endDate}
                  </Text>
                </View>
                {exp.bullets.map((b, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {cv.education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Educación</Text>
            {cv.education.map((ed) => (
              <View key={ed.id} style={{ marginBottom: 6 }}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>{ed.institution}</Text>
                  <Text style={styles.itemMeta}>
                    {ed.startDate} — {ed.endDate}
                  </Text>
                </View>
                <Text>{ed.degree}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {cv.projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proyectos personales</Text>
            {cv.projects.map((p) => (
              <View key={p.id} style={{ marginBottom: 6 }}>
                <Text style={styles.itemTitle}>{p.name}</Text>
                {p.description ? <Text>{p.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {cv.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habilidades técnicas</Text>
            <Text>{cv.skills.join(", ")}</Text>
          </View>
        ) : null}

        {cv.languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Idiomas</Text>
            <Text>
              {cv.languages
                .map((l) => `${l.language}${l.level ? `: ${l.level}` : ""}`)
                .join(" · ")}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

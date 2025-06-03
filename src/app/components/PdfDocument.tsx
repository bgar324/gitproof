import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { getLanguageColor } from "./RepoCard";

// Helper to ensure we get a string from getLanguageColor
const getColorString = (language: string | null): string => {
  const color = getLanguageColor(language);
  return typeof color === "string" ? color : "#94a3b8";
};

// Helper to get top languages with percentages
const getTopLanguages = (
  languages: Record<string, number> | undefined,
  maxCount = 3
) => {
  if (!languages) return [];

  const totalBytes = Object.values(languages).reduce(
    (sum, bytes) => sum + bytes,
    0
  );
  if (totalBytes === 0) return [];

  return Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      percent: Math.round((bytes / totalBytes) * 1000) / 10, // Keep one decimal place
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, maxCount);
};

import type { ExportConfig, ProjectExport, StackSummary } from "@/types/export";

interface PdfDocumentProps {
  config: ExportConfig;
  userProfile: {
    name: string;
    avatarUrl: string;
    githubUrl: string;
    bio: string | null;
  };
  projects: ProjectExport[];
  stackSummary: StackSummary;
  generatedAt: string;
  developerSummary?: string | null;
  metrics?: {
    totalRepos: number;
    totalCommits: number;
    yearsOnGitHub: number;
  } | null;
}

// Helper functions
const getLighterColor = (color: string): string => {
  // Simple function to lighten the color for the chip background
  return color + "33"; // Add 20% opacity
};

Font.register({
  family: "Reckless",
  fonts: [
    {
      src: "/fonts/font_reckless/RecklessNeue-Regular.ttf",
      fontWeight: "normal",
    },
    { src: "/fonts/font_reckless/RecklessNeue-Bold.ttf", fontWeight: "bold" },
    {
      src: "/fonts/font_reckless/RecklessNeue-Italic.ttf",
      fontStyle: "italic",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    padding: 36,
    // fontFamily: 'Inter',
    fontSize: 12,
    color: "#18181b",
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 18,
    marginTop: 12,
  },
  headerText: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingTop: 4,
  },
  name: {
    fontFamily: "Reckless",
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 3,
    color: "#111827",
  },
  bio: {
    // fontFamily: "Inter",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 2,
  },
  github: {
    // fontFamily: "Inter",
    fontSize: 10,
    color: "#737373",
    textDecoration: "none",
    marginBottom: 8,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    objectFit: "cover",
  },
  logo: {
    width: 40,
    height: 40,
    marginLeft: "auto",
    alignSelf: "center",
    marginTop: 6,
  },
  hr: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
    marginBottom: 22,
  },
  columns: {
    flexDirection: "row",
    gap: 28,
    alignItems: "flex-start",
    width: "100%",
  },
  leftCol: {
    width: 170,
    paddingRight: 24,
  },
  rightCol: {
    flex: 1,
    paddingLeft: 12,
  },
  sectionTitle: {
    fontFamily: "Reckless",
    fontWeight: "bold",
    fontSize: 19,
    color: "#18181b",
    marginBottom: 14,
  },
  stackSection: {
    marginBottom: 18,
  },
  stackItem: {
    marginBottom: 10,
  },
  stackBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stackBarName: {
    fontSize: 12,
    fontWeight: 400,
    color: "#18181b",
  },
  stackBarPercent: {
    fontSize: 11,
    color: "#5A5A5A",
    fontWeight: 400,
  },
  stackBarBg: {
    width: "100%",
    height: 7,
    borderRadius: 5,
    backgroundColor: "#f1f5f9",
    marginTop: 1,
    position: "relative",
    overflow: "hidden",
  },
  stackBarFill: {
    height: 7,
    borderRadius: 5,
    backgroundColor: "#18181b",
    position: "absolute",
    left: 0,
    top: 0,
  },
  frameworksSection: {
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 5,
    marginBottom: 2,
  },
  chip: {
    backgroundColor: "#e5e7eb",
    color: "#222",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 11,
    marginRight: 4,
    marginBottom: 6,
    // fontFamily: "Inter",
  },
  contactSection: {
    marginTop: 24,
    marginBottom: 10,
  },
  contactTitle: {
    fontFamily: "Reckless",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#18181b",
  },
  contactText: {
    fontSize: 12,
    color: "#18181b",
    marginBottom: 2,
    // fontFamily: "Inter",
  },
  contactLink: {
    color: "#222",
    textDecoration: "underline",
    fontSize: 12,
    // fontFamily: "Inter",
    fontWeight: "bold",
  },
  featuredProjectsSection: {
    marginBottom: 24,
  },
  projectCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
    flexDirection: "column",
    gap: 8,
  },
  projectHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    fontFamily: "Reckless",
  },
  projectLangChip: {
    fontSize: 10,
    color: "#222",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginLeft: 4,
  },
  projectDesc: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 1.4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 4,
  },
  developmentActivity: {
    marginTop: 24,
  },
  devActTitle: {
    fontFamily: "Reckless",
    fontWeight: "bold",
    fontSize: 19,
    color: "#18181b",
    marginBottom: 12,
  },
  devActGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    width: "100%",
  },
  devActCard: {
    flex: 1,
    backgroundColor: "#fafafa",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 92,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  devActHeading: {
    fontFamily: "Reckless",
    fontSize: 13,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 5,
  },
  devActPlaceholder: {
    // fontFamily: "Inter",
    fontSize: 11,
    color: "#b4b4b4",
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 18,
    fontSize: 11,
    color: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  developerSummary: {
    marginBottom: 24,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#4b5563",
  },
  footerLogo: {
    width: 18,
    height: 18,
  },
  footerTagline: {
    // fontFamily: "Inter",
    fontSize: 11,
    color: "#18181b",
  },
  footerTaglineEm: {
    // fontFamily: "Inter",
    fontStyle: "italic",
    color: "#18181b",
  },
  // Project tech stack styles
  projectTechStackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  projectTechChip: {
    fontSize: 11,
    color: "#4b5563",
    backgroundColor: "#f3f4f6",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  // Tech stack chips with percentages
  techStackContainer: {
    marginTop: 6,
  },
  techStackChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  techStackChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  techStackChipName: {
    fontSize: 9,
    color: "#333",
    marginRight: 4,
  },
  techStackChipPercent: {
    fontSize: 9,
    color: "#666",
    fontWeight: "bold",
  },
});

interface TechTagsProps {
  tags: string[];
  maxTags?: number;
}

const TechTags = ({ tags, maxTags = 5 }: TechTagsProps) => (
  <View style={styles.projectTechStackRow}>
    {tags.slice(0, maxTags).map((tag) => (
      <Text key={tag} style={styles.projectTechChip}>
        {tag}
      </Text>
    ))}
    {tags.length > maxTags && (
      <Text style={styles.projectTechChip}>+{tags.length - maxTags} more</Text>
    )}
  </View>
);

export const PdfDocument = ({
  config,
  userProfile,
  projects,
  stackSummary,
  generatedAt,
  developerSummary,
  metrics,
}: PdfDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER - Only show if identity section is enabled */}
      {config.sections.identity && (
        <>
          <View style={styles.headerRow}>
            <Image src={userProfile.avatarUrl} style={styles.avatar} />
            <View style={styles.headerText}>
              <Text style={styles.name}>{userProfile.name}</Text>
              {userProfile.bio && (
                <Text style={styles.bio}>{userProfile.bio}</Text>
              )}
              <Text style={styles.github}>
                {userProfile.githubUrl.replace("https://github.com/", "")}
              </Text>
            </View>
            <Image src="/gitprooflogo.png" style={styles.logo} />
          </View>
          <View style={styles.hr} />
        </>
      )}

      {/* MAIN COLUMNS */}
      <View style={styles.columns}>
        {/* LEFT COLUMN */}
        <View style={styles.leftCol}>
          {/* TECH STACK - Only show if stack section is enabled */}
          {config.sections.stack && (
            <>
              <View style={styles.stackSection}>
                <Text style={styles.sectionTitle}>Technical Stack</Text>
                {stackSummary.languages.slice(0, 5).map((lang) => (
                  <View key={lang.name} style={styles.stackItem}>
                    <View style={styles.stackBarRow}>
                      <Text style={styles.stackBarName}>{lang.name}</Text>
                      <Text style={styles.stackBarPercent}>
                        {Math.round(lang.percentage)}%
                      </Text>
                    </View>
                    <View style={styles.stackBarBg}>
                      <View
                        style={{
                          ...styles.stackBarFill,
                          width: `${lang.percentage}%`,
                          backgroundColor: getColorString(lang.name),
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.frameworksSection}>
                <Text style={styles.sectionTitle}>Metrics</Text>
                {config.includeMetrics && metrics ? (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={styles.contactText}>
                      Repository Count: {metrics.totalRepos}
                    </Text>
                    <Text style={styles.contactText}>
                      Total Commits: {metrics.totalCommits}
                    </Text>
                    <Text style={styles.contactText}>
                      Years on GitHub: {metrics.yearsOnGitHub}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.chipRow}>
                    {stackSummary.topFrameworks.slice(0, 8).map((fw) => (
                      <Text key={fw} style={styles.chip}>
                        {fw}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {/* CONTACT INFO - Always show */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.contactText}>GitHub</Text>
            <Text style={styles.contactLink}>
              {userProfile.githubUrl.replace("https://github.com/", "")}
            </Text>
            <Text style={styles.contactText}>Last Updated</Text>
            <Text style={styles.contactText}>{generatedAt}</Text>
          </View>
        </View>

        {/* RIGHT COLUMN */}
        <View style={styles.rightCol}>
          {/* PROJECTS - Only show if projects section is enabled */}
          {config.sections.projects && projects.length > 0 && (
            <View style={styles.featuredProjectsSection}>
              <Text style={styles.sectionTitle}>
                {projects.length === 1
                  ? "Featured Project"
                  : "Featured Projects"}
              </Text>
              {projects.slice(0, 3).map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectHeaderRow}>
                    <Text style={styles.projectTitle}>{project.name}</Text>
                    {project.language && (
                      <Text
                        style={[
                          styles.projectLangChip,
                          {
                            backgroundColor: getLighterColor(
                              getColorString(project.language)
                            ),
                          },
                        ]}
                      >
                        {project.language}
                      </Text>
                    )}
                  </View>

                  {project.description && (
                    <Text style={styles.projectDesc}>
                      {project.description}
                    </Text>
                  )}

                  <View style={styles.techStackContainer}>
                    {/* Show tech stack with percentages if available */}
                    {project.languages &&
                    Object.keys(project.languages).length > 0 ? (
                      <View style={styles.techStackChips}>
                        {getTopLanguages(project.languages, 3).map((lang) => (
                          <View
                            key={lang.name}
                            style={[
                              styles.techStackChip,
                              {
                                backgroundColor: getLighterColor(
                                  getColorString(lang.name)
                                ),
                              },
                            ]}
                          >
                            <Text style={styles.techStackChipName}>
                              {lang.name}
                            </Text>
                            <Text style={styles.techStackChipPercent}>
                              {lang.percent}%
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : project.tags && project.tags.length > 0 ? (
                      <View style={styles.projectTechStackRow}>
                        {project.tags.slice(0, 5).map((tag) => (
                          <Text key={tag} style={styles.projectTechChip}>
                            {tag}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer} fixed>
        <Image src="/gitprooflogo.png" style={styles.footerLogo} />
        <Text style={styles.footerTagline}>
          Proof of work, <Text style={styles.footerTaglineEm}>without</Text> the
          guesswork.
        </Text>
      </View>

      {/* Developer Summary */}
      {config.includeDeveloperSummary && developerSummary && (
        <View style={styles.developerSummary}>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Developer Summary</Text>
          <Text style={styles.summaryText}>{developerSummary}</Text>
        </View>
      )}
    </Page>
  </Document>
);

export default PdfDocument;

const extractSection = (markdown, heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(markdown || "").match(
    new RegExp(`^#{1,3}\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=^#{1,3}\\s+|$)`, "im"),
  );
  return match?.[1]?.trim() || "";
};

export const parseAnalysisSections = (markdown) => ({
  architectureSummary: extractSection(markdown, "Architecture") || String(markdown || "").trim(),
  criticalPathAnalysis:
    extractSection(markdown, "Critical Execution Paths") ||
    "Critical path details were not included in the generated repository analysis.",
  onboardingGuide:
    extractSection(markdown, "Developer Onboarding") ||
    "Start with a detected entry point, then follow its imports into the related modules.",
});

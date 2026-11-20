import milestones from "../../../content/journeys/milestones.json";
import ranks from "../../../content/journeys/ranks.json";
import airports from "../../../content/journeys/airports.json";
import j1 from "../../../content/journeys/templates/hsc-bachelors-abroad.json";
import j2 from "../../../content/journeys/templates/hsc-bachelors-home.json";
import j3 from "../../../content/journeys/templates/ug-masters-abroad.json";
import type { Content, MilestoneDef, RankDef, Template } from "./types";

/** The content shipped in content/journeys. */
export const defaultContent: Content = {
  milestones: milestones.milestones as MilestoneDef[],
  templates: [j1, j2, j3] as Template[],
  ranks: ranks.ranks as RankDef[],
  airports: airports as Content["airports"],
};

/**
 * Checks that the content is consistent: every template milestone exists in the
 * library, every rank requirement exists, and keys are unique. Returns a list of problems.
 */
export function validateContent(content: Content): string[] {
  const problems: string[] = [];
  const library = new Map<string, MilestoneDef>();
  for (const m of content.milestones) {
    if (library.has(m.key)) problems.push(`Duplicate milestone key "${m.key}"`);
    library.set(m.key, m);
    const taskKeys = new Set<string>();
    for (const t of m.tasks) {
      if (taskKeys.has(t.key)) problems.push(`Duplicate task "${m.key}.${t.key}"`);
      taskKeys.add(t.key);
      if (!(t.exp > 0)) problems.push(`Task "${m.key}.${t.key}" needs positive EXP`);
    }
    if (m.tasks.length === 0) problems.push(`Milestone "${m.key}" has no tasks`);
  }

  const templateKeys = new Set(content.templates.map((t) => t.key));
  for (const template of content.templates) {
    if (template.next && !templateKeys.has(template.next)) {
      problems.push(`Template "${template.key}" points to unknown next template "${template.next}"`);
    }
    const seen = new Set<string>();
    for (const phase of template.phases) {
      for (const tm of phase.milestones) {
        if (!library.has(tm.key)) problems.push(`Template "${template.key}" uses unknown milestone "${tm.key}"`);
        if (seen.has(tm.key)) problems.push(`Template "${template.key}" lists "${tm.key}" twice`);
        seen.add(tm.key);
        if (!(tm.duration >= 1)) problems.push(`"${template.key}/${tm.key}" needs a duration of at least 1 month`);
        if (tm.anchor === "intake" && !template.defaultIntake) {
          problems.push(`"${template.key}/${tm.key}" uses the intake anchor but the template has no defaultIntake`);
        }
      }
    }
  }

  for (const rank of content.ranks) {
    for (const req of rank.gate?.requires ?? []) {
      const [mKey, tKey] = req.split(".");
      const m = mKey ? library.get(mKey) : undefined;
      if (!m) problems.push(`Rank ${rank.rank} requires unknown milestone "${req}"`);
      else if (tKey && !m.tasks.some((t) => t.key === tKey)) problems.push(`Rank ${rank.rank} requires unknown task "${req}"`);
    }
  }
  return problems;
}

import {
  Award,
  BookOpen,
  CalendarDays,
  Circle,
  ClipboardCheck,
  Compass,
  FileText,
  Files,
  FlaskConical,
  FolderOpen,
  Gauge,
  GraduationCap,
  Headphones,
  IdCard,
  Languages,
  ListChecks,
  PenLine,
  PencilLine,
  PlaneTakeoff,
  Rocket,
  School,
  Send,
  Signpost,
  Stamp,
  Target,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Stat } from "@dreamer/journey-engine";

const BY_MILESTONE: Record<string, LucideIcon> = {
  profile_setup: UserRound,
  hsc_study_plan: Target,
  english_habit: Languages,
  english_foundation: BookOpen,
  explore_paths: Compass,
  path_decision: Signpost,
  passport: IdCard,
  docs_folder: FolderOpen,
  english_level_check: Gauge,
  college_referees: UserCheck,
  sat_prep: PencilLine,
  gre_prep: PencilLine,
  ielts_coaching: Headphones,
  ielts_test: ClipboardCheck,
  university_admission_home: School,
  cgpa_goal: TrendingUp,
  projects_activities: Rocket,
  faculty_relationships: Users,
  cv_draft: FileText,
  research_internship: FlaskConical,
  scholarship_calendar: CalendarDays,
  shortlist: ListChecks,
  scholarships: Award,
  documents_ready: Files,
  sop: PenLine,
  apply: Send,
  offers_funding: Wallet,
  visa: Stamp,
  pre_departure: PlaneTakeoff,
};

const BY_STAT: Record<Stat, LucideIcon> = {
  english: Languages,
  academics: GraduationCap,
  documents: FileText,
  profile: UserRound,
  funding: Wallet,
};

type IconProps = { size?: number; className?: string };

/** Thin line icon for a milestone, in the current text colour. */
export function MilestoneIcon({ milestone, size = 16, className = "" }: IconProps & { milestone: string }) {
  const Icon = BY_MILESTONE[milestone] ?? Circle;
  return <Icon size={size} strokeWidth={1.5} className={`shrink-0 ${className}`} aria-hidden="true" />;
}

export function StatIcon({ stat, size = 16, className = "" }: IconProps & { stat: Stat }) {
  const Icon = BY_STAT[stat];
  return <Icon size={size} strokeWidth={1.5} className={`shrink-0 ${className}`} aria-hidden="true" />;
}

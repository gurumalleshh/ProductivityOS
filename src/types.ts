export type ActivityCadence = 'daily' | 'weekly';

export interface ActivityDiscipline {
  id: string; // e.g. "coding", "weekly_review", "reading"
  name: string;
  tagline?: string;
  category: string; // e.g. "Technical", "Fitness", "Review", "Creative"
  cadence: ActivityCadence; // 'daily' | 'weekly'
  targetMinutes: number; // in minutes (e.g. 60)
  weeklyTargetCount?: number; // e.g. 1 (times per week)
  color: string; // hex color e.g. "#4F46E5"
  icon: string; // lucide icon identifier
  isActive: boolean;
  createdAt?: string;
}

export interface UserSettings {
  disciplines: ActivityDiscipline[];
  theme: 'light' | 'dark';
  connectedSpreadsheetId?: string;
  connectedSpreadsheetUrl?: string;

  // Optional backward compatibility targets
  codingTarget?: number;
  developmentTarget?: number;
  softSkillsTarget?: number;
  editingTarget?: number;
  workoutTarget?: number;
}

export interface DailyRecord {
  id: string; // e.g. "2026-09-19"
  date: string; // YYYY-MM-DD
  day: string; // Monday, Tuesday, etc.
  week: number; // ISO Week 1-53
  month: string; // YYYY-MM
  year: number; // 2026
  
  // Dynamic discipline values (keyed by discipline.id)
  activityActuals: Record<string, number>;  // minutes logged
  activityTargets: Record<string, number>;  // target minutes for that day
  activityPcts: Record<string, number>;     // completion percentage
  activityPercentages?: Record<string, number>; // alias for completion percentage
  weeklyCompleted?: Record<string, boolean>; // weekly activity completed flag

  // Aggregate totals
  totalTarget: number; // sum of applicable targets
  totalActual: number; // sum of actual logged minutes
  overallPct: number;  // balanced overall percentage
  status: 'COMPLETED' | 'GOOD' | 'PARTIAL' | 'LOW';
  notes: string;

  // Legacy fields for backward compatibility if needed
  codingTarget?: number;
  developmentTarget?: number;
  softSkillsTarget?: number;
  editingTarget?: number;
  workoutTarget?: number;
  codingActual?: number;
  developmentActual?: number;
  softSkillsActual?: number;
  editingActual?: number;
  workoutActual?: number;
  codingPct?: number;
  developmentPct?: number;
  softSkillsPct?: number;
  editingPct?: number;
  workoutPct?: number;
}

export interface SheetArchitectSpec {
  sheetNumber: string;
  title: string;
  purpose: string;
  headerColumns: { col: string; name: string; formulaOrType: string; format: string }[];
  keyFormulas: { label: string; formula: string; description: string }[];
  conditionalFormatting: string[];
  charts: {
    title: string;
    type: string;
    dataRange: string;
    xAxis: string;
    yAxis: string;
    purpose: string;
  }[];
}

export type ViewTab =
  | 'dashboard'
  | 'tracker'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'settings'
  | 'sheetsPlan'
  | 'readme'
  | string; // Any dynamic discipline.id (e.g. "coding", "weekly_review", etc.)


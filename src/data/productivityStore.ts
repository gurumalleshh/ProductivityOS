import {
  DailyRecord,
  UserSettings,
  ActivityDiscipline,
  StreakInfo,
  HeatmapDayData,
  TimeFilterPeriod,
} from '../types';

// Core 5 User Productivity Goals (Total 4h 15m / 255m per day)
export const CORE_USER_GOAL_DISCIPLINES: ActivityDiscipline[] = [
  {
    id: 'coding',
    name: 'Coding',
    tagline: 'Problem solving, algorithms & depth (1h/day)',
    category: 'Technical',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#4F46E5',
    icon: 'code',
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'web_dev',
    name: 'Web Development',
    tagline: 'Frontend, backend & shipping features (1h/day)',
    category: 'Engineering',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#2563EB',
    icon: 'laptop',
    isActive: true,
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'aptitude_soft_skills',
    name: 'Soft Skills + Aptitude',
    tagline: 'Verbal, reasoning & communication practice (30m/day)',
    category: 'Personal Growth',
    cadence: 'daily',
    targetMinutes: 30,
    color: '#7C3AED',
    icon: 'sparkles',
    isActive: true,
    order: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'video_editing',
    name: 'Video Editing Learning',
    tagline: 'Cuts, motion graphics & visual storytelling (45m/day)',
    category: 'Creative',
    cadence: 'daily',
    targetMinutes: 45,
    color: '#D97706',
    icon: 'video',
    isActive: true,
    order: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'workout',
    name: 'Morning Workout',
    tagline: 'High-discipline strength, cardio & conditioning (1h/day)',
    category: 'Fitness',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#059669',
    icon: 'dumbbell',
    isActive: true,
    order: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const POPULAR_DISCIPLINE_PRESETS: Omit<ActivityDiscipline, 'id' | 'isActive'>[] = [
  {
    name: 'Coding',
    tagline: 'LeetCode, data structures & algorithmic depth',
    category: 'Technical',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#4F46E5',
    icon: 'code',
  },
  {
    name: 'Web Development',
    tagline: 'Shipping production code, UI features & APIs',
    category: 'Engineering',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#2563EB',
    icon: 'laptop',
  },
  {
    name: 'Soft Skills + Aptitude',
    tagline: 'Communication, verbal reasoning & problem solving',
    category: 'Personal Growth',
    cadence: 'daily',
    targetMinutes: 30,
    color: '#7C3AED',
    icon: 'sparkles',
  },
  {
    name: 'Video Editing Learning',
    tagline: 'Storytelling, pacing, audio mixing & visual effects',
    category: 'Creative',
    cadence: 'daily',
    targetMinutes: 45,
    color: '#D97706',
    icon: 'video',
  },
  {
    name: 'Morning Workout',
    tagline: 'High-discipline strength, cardio & energy conditioning',
    category: 'Fitness',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#059669',
    icon: 'dumbbell',
  },
  {
    name: 'Weekly Architecture Review',
    tagline: 'Deep audit of codebase, roadmap & weekly retrospective',
    category: 'Review & Strategy',
    cadence: 'weekly',
    targetMinutes: 90,
    weeklyTargetCount: 1,
    color: '#0891B2',
    icon: 'calendar-check',
  },
  {
    name: 'Focused Reading & Research',
    tagline: 'Technical documentation, books & whitepapers',
    category: 'Learning',
    cadence: 'daily',
    targetMinutes: 30,
    color: '#475569',
    icon: 'book',
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  disciplines: CORE_USER_GOAL_DISCIPLINES,
  theme: 'light',
  consistencyThreshold: 80,
};

export interface DurationValidationResult {
  isValid: boolean;
  minutes: number;
  error?: string;
}

// Rigorous validation for duration input (supports H:MM, minutes, 1h 15m, 45m)
export function validateDurationInput(val: string | number | undefined | null): DurationValidationResult {
  if (val === undefined || val === null) {
    return { isValid: true, minutes: 0 };
  }

  if (typeof val === 'number') {
    if (isNaN(val)) {
      return { isValid: false, minutes: 0, error: 'Duration cannot be NaN.' };
    }
    if (val < 0) {
      return { isValid: false, minutes: 0, error: 'Duration cannot be negative.' };
    }
    if (val > 1440) {
      return { isValid: false, minutes: 0, error: 'Duration cannot exceed 24 hours (1440 minutes).' };
    }
    return { isValid: true, minutes: Math.round(val) };
  }

  const str = String(val).trim();
  if (str === '') {
    return { isValid: true, minutes: 0 };
  }

  // Reject explicit negative values
  if (str.startsWith('-') || str.includes(' -') || str.includes(':-')) {
    return { isValid: false, minutes: 0, error: 'Duration cannot be negative.' };
  }

  // Check clock format "H:MM" or "HH:MM"
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length !== 2) {
      return { isValid: false, minutes: 0, error: 'Invalid time format. Use H:MM (e.g. 1:15).' };
    }
    const [hStr, mStr] = parts;
    if (!/^\d+$/.test(hStr.trim()) || !/^\d+$/.test(mStr.trim())) {
      return { isValid: false, minutes: 0, error: 'Hours and minutes must be non-negative integers.' };
    }
    const h = parseInt(hStr.trim(), 10);
    const m = parseInt(mStr.trim(), 10);
    if (m >= 60) {
      return { isValid: false, minutes: 0, error: 'Minutes in clock format must be between 00 and 59.' };
    }
    const totalMinutes = h * 60 + m;
    if (totalMinutes > 1440) {
      return { isValid: false, minutes: 0, error: 'Duration cannot exceed 24 hours (1440 minutes).' };
    }
    return { isValid: true, minutes: totalMinutes };
  }

  // Handle patterns like "1h 30m", "1h", "45m", "90mins"
  const hMatch = str.match(/^(\d+)\s*h(?:our|ours)?(?:\s*(\d+)\s*(?:m|min|mins|minute|minutes)?)?$/i);
  if (hMatch) {
    const h = parseInt(hMatch[1], 10);
    const m = hMatch[2] ? parseInt(hMatch[2], 10) : 0;
    if (m >= 60) {
      return { isValid: false, minutes: 0, error: 'Minutes must be between 00 and 59.' };
    }
    const totalMinutes = h * 60 + m;
    if (totalMinutes > 1440) {
      return { isValid: false, minutes: 0, error: 'Duration cannot exceed 24 hours (1440 minutes).' };
    }
    return { isValid: true, minutes: totalMinutes };
  }

  const mMatch = str.match(/^(\d+)\s*(?:m|min|mins|minute|minutes)?$/i);
  if (mMatch) {
    const totalMinutes = parseInt(mMatch[1], 10);
    if (totalMinutes > 1440) {
      return { isValid: false, minutes: 0, error: 'Duration cannot exceed 24 hours (1440 minutes).' };
    }
    return { isValid: true, minutes: totalMinutes };
  }

  return {
    isValid: false,
    minutes: 0,
    error: 'Invalid duration. Enter minutes (e.g. 75) or clock format (e.g. 1:15).',
  };
}

// Validates ISO date format YYYY-MM-DD and real calendar validity
export function isValidISODateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// Formats minutes to "1h 15m", "45m", or "1:15" duration
export function formatMinutes(minutes: number, style: 'short' | 'clock' = 'short'): string {
  if (minutes === 0) return style === 'clock' ? '0:00' : '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (style === 'clock') {
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  }

  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

// Parses "1:15", "75", "1h 15m", or "45m" into minutes
export function parseDurationInput(val: string | number): number {
  const res = validateDurationInput(val);
  return res.isValid ? res.minutes : 0;
}

export function computeDailyStatus(overallPct: number): 'COMPLETED' | 'GOOD' | 'PARTIAL' | 'LOW' {
  if (overallPct >= 100) return 'COMPLETED';
  if (overallPct >= 80) return 'GOOD';
  if (overallPct >= 50) return 'PARTIAL';
  return 'LOW';
}

// Helper to get ISO week number
export function getISOWeek(dateStr: string): { week: number; year: number; dayName: string; monthStr: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const monthStr = dateStr.substring(0, 7);
  const year = d.getFullYear();

  const targetDate = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  targetDate.setDate(targetDate.getDate() - dayNr + 3);
  const firstThursday = targetDate.valueOf();
  targetDate.setMonth(0, 1);
  if (targetDate.getDay() !== 4) {
    targetDate.setMonth(0, 1 + ((4 - targetDate.getDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - targetDate.valueOf()) / 604800000);
  return { week, year, dayName, monthStr };
}

// Calculates dynamic daily record for any set of user-configured disciplines
export function computeDailyRecord(
  dateStr: string,
  actuals: Record<string, number>,
  settings: UserSettings,
  notes: string = '',
  weeklyCompletedMap: Record<string, boolean> = {},
  existingRecordMeta?: { id?: string; createdAt?: string; updatedAt?: string }
): DailyRecord {
  const { week, year, dayName, monthStr } = getISOWeek(dateStr);

  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false && !d.isArchived);
  const dailyDisciplines = activeDisciplines.filter((d) => d.cadence === 'daily');
  const weeklyDisciplines = activeDisciplines.filter((d) => d.cadence === 'weekly');

  const activityActuals: Record<string, number> = {};
  const activityTargets: Record<string, number> = {};
  const activityPcts: Record<string, number> = {};
  const weeklyCompleted: Record<string, boolean> = { ...weeklyCompletedMap };

  let dailyTotalTarget = 0;
  let dailyCappedActual = 0;
  let totalActual = 0;

  // Process daily disciplines
  dailyDisciplines.forEach((d) => {
    const act = Math.max(0, actuals[d.id] || 0);
    const tgt = Math.max(0, d.targetMinutes);
    activityActuals[d.id] = act;
    activityTargets[d.id] = tgt;
    activityPcts[d.id] = tgt > 0 ? Math.round((act / tgt) * 100) : 100;
    
    dailyTotalTarget += tgt;
    dailyCappedActual += Math.min(act, tgt);
    totalActual += act;
  });

  // Process weekly disciplines
  weeklyDisciplines.forEach((d) => {
    const act = Math.max(0, actuals[d.id] || 0);
    const tgt = Math.max(0, d.targetMinutes);
    activityActuals[d.id] = act;
    activityTargets[d.id] = tgt;
    activityPcts[d.id] = tgt > 0 ? Math.round((act / tgt) * 100) : 100;
    if (act >= tgt && tgt > 0) {
      weeklyCompleted[d.id] = true;
    }
    totalActual += act;
  });

  // Preserve historical actuals for archived or inactive disciplines
  Object.keys(actuals).forEach((actId) => {
    if (activityActuals[actId] === undefined) {
      const actMins = Math.max(0, actuals[actId] || 0);
      if (actMins > 0) {
        activityActuals[actId] = actMins;
        totalActual += actMins;
      }
    }
  });

  // Overall percentage
  let overallPct = 0;
  if (dailyTotalTarget > 0) {
    overallPct = Math.round((dailyCappedActual / dailyTotalTarget) * 100);
  } else if (activeDisciplines.length > 0) {
    // If only weekly disciplines exist or targets are 0
    const totalTgt = activeDisciplines.reduce((a, b) => a + b.targetMinutes, 0);
    overallPct = totalTgt > 0 ? Math.min(100, Math.round((totalActual / totalTgt) * 100)) : (totalActual > 0 ? 100 : 0);
  } else {
    overallPct = totalActual > 0 ? 100 : 0;
  }

  const status = computeDailyStatus(overallPct);

  return {
    id: existingRecordMeta?.id || dateStr,
    date: dateStr,
    day: dayName,
    week,
    month: monthStr,
    year,
    activityActuals,
    activityTargets,
    activityPcts,
    activityPercentages: activityPcts,
    weeklyCompleted,
    totalTarget: dailyTotalTarget,
    totalActual,
    overallPct,
    status,
    notes,
    createdAt: existingRecordMeta?.createdAt,
    updatedAt: existingRecordMeta?.updatedAt,
  };
}

// Check if a weekly discipline was completed in a given week
export function isWeeklyDisciplineCompleted(
  records: DailyRecord[],
  disciplineId: string,
  weekNumber: number,
  year: number
): { completed: boolean; totalMinutes: number; daysLogged: string[] } {
  const weekRecords = records.filter((r) => r.week === weekNumber && r.year === year);
  let totalMinutes = 0;
  const daysLogged: string[] = [];
  let isMarked = false;

  weekRecords.forEach((r) => {
    const m = r.activityActuals?.[disciplineId] || 0;
    if (m > 0) {
      totalMinutes += m;
      daysLogged.push(r.date);
    }
    if (r.weeklyCompleted?.[disciplineId]) {
      isMarked = true;
    }
  });

  return {
    completed: isMarked || totalMinutes > 0,
    totalMinutes,
    daysLogged,
  };
}

// =========================================================================
// CALENDAR & DATE UTILITIES
// =========================================================================

export function areConsecutiveDays(earlierDateStr: string, laterDateStr: string): boolean {
  const d1 = new Date(earlierDateStr + 'T00:00:00Z');
  const d2 = new Date(laterDateStr + 'T00:00:00Z');
  const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayISO(): string {
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const y = yest.getFullYear();
  const m = String(yest.getMonth() + 1).padStart(2, '0');
  const d = String(yest.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// =========================================================================
// ADVANCED STREAK SYSTEM (PHASE 4)
// =========================================================================

/**
 * Calculates a robust calendar-consecutive streak for any qualifying predicate.
 * - Respects true consecutive calendar dates (no skips).
 * - Distinguishes between today completed vs today in-progress.
 * - If today is in-progress but yesterday was achieved, the streak is maintained.
 * - Never counts future dates as missed.
 */
export function calculateStreakForPredicate(
  records: DailyRecord[],
  predicate: (r: DailyRecord) => boolean,
  explanation: string
): StreakInfo {
  const todayStr = getTodayISO();
  const yesterdayStr = getYesterdayISO();

  // Deduplicate records by date (keep latest) and omit future dates
  const dateMap: Record<string, DailyRecord> = {};
  records.forEach((r) => {
    if (r.date <= todayStr) {
      dateMap[r.date] = r;
    }
  });

  const qualifyingDates = Object.keys(dateMap)
    .filter((d) => predicate(dateMap[d]))
    .sort();

  if (qualifyingDates.length === 0) {
    return {
      current: 0,
      longest: 0,
      isActiveToday: false,
      isMaintained: false,
      explanation,
    };
  }

  // Derive longest streak with strict calendar continuity
  let longest = 1;
  let running = 1;
  for (let i = 1; i < qualifyingDates.length; i++) {
    if (areConsecutiveDays(qualifyingDates[i - 1], qualifyingDates[i])) {
      running++;
      if (running > longest) longest = running;
    } else {
      running = 1;
    }
  }

  // Calculate active current streak
  const hasToday = qualifyingDates.includes(todayStr);
  const hasYesterday = qualifyingDates.includes(yesterdayStr);

  let current = 0;
  let isMaintained = false;
  let isActiveToday = false;

  if (hasToday) {
    isActiveToday = true;
    isMaintained = true;
    current = 1;
    let anchor = todayStr;
    const todayIdx = qualifyingDates.indexOf(todayStr);
    for (let i = todayIdx - 1; i >= 0; i--) {
      if (areConsecutiveDays(qualifyingDates[i], anchor)) {
        current++;
        anchor = qualifyingDates[i];
      } else {
        break;
      }
    }
  } else if (hasYesterday) {
    // Today not yet met (or day in-progress), but yesterday was met -> maintained!
    isActiveToday = false;
    isMaintained = true;
    current = 1;
    let anchor = yesterdayStr;
    const yestIdx = qualifyingDates.indexOf(yesterdayStr);
    for (let i = yestIdx - 1; i >= 0; i--) {
      if (areConsecutiveDays(qualifyingDates[i], anchor)) {
        current++;
        anchor = qualifyingDates[i];
      } else {
        break;
      }
    }
  } else {
    current = 0;
    isActiveToday = false;
    isMaintained = false;
  }

  if (current > longest) longest = current;

  return {
    current,
    longest,
    isActiveToday,
    isMaintained,
    explanation,
  };
}

/**
 * 1. Daily Consistency Streak (Threshold based: default >= 80% or user configured)
 */
export function calculateConsistencyStreak(
  records: DailyRecord[],
  thresholdPercent: number = 80
): StreakInfo {
  const explanation = `Consecutive days achieving at least ${thresholdPercent}% of daily productivity target.`;
  return calculateStreakForPredicate(
    records,
    (r) => r.overallPct >= thresholdPercent,
    explanation
  );
}

/**
 * 2. Daily Goal Streak (100% full target achieved)
 */
export function calculateGoalStreak(records: DailyRecord[]): StreakInfo {
  const explanation = `Consecutive days achieving 100% or more of daily productivity target.`;
  return calculateStreakForPredicate(
    records,
    (r) => r.overallPct >= 100,
    explanation
  );
}

/**
 * 3. Per-Activity Streak (handles daily or weekly cadence separately)
 */
export function calculateDisciplineStreakEnhanced(
  records: DailyRecord[],
  discipline: ActivityDiscipline
): StreakInfo {
  if (discipline.cadence === 'daily') {
    const target = discipline.targetMinutes;
    const explanation = `${discipline.name}: Consecutive days logging target time (${target > 0 ? formatMinutes(target) : 'any'}/day).`;
    return calculateStreakForPredicate(
      records,
      (r) => {
        const act = r.activityActuals?.[discipline.id] || 0;
        return target > 0 ? act >= target : act > 0;
      },
      explanation
    );
  } else {
    // Weekly activity streak: consecutive ISO weeks met
    const weekMap: Record<string, number> = {};
    records.forEach((r) => {
      const key = `${r.year}-W${String(r.week).padStart(2, '0')}`;
      const act = r.activityActuals?.[discipline.id] || 0;
      weekMap[key] = (weekMap[key] || 0) + act;
    });

    const target = discipline.targetMinutes || 0;
    const qualifyingWeeks = Object.keys(weekMap)
      .filter((k) => (target > 0 ? weekMap[k] >= target : weekMap[k] > 0))
      .sort();

    const explanation = `${discipline.name}: Consecutive weeks achieving weekly goal (${formatMinutes(target)}/week).`;

    if (qualifyingWeeks.length === 0) {
      return {
        current: 0,
        longest: 0,
        isActiveToday: false,
        isMaintained: false,
        explanation,
      };
    }

    let longest = 1;
    let running = 1;
    for (let i = 1; i < qualifyingWeeks.length; i++) {
      const [y1, w1] = qualifyingWeeks[i - 1].split('-W').map(Number);
      const [y2, w2] = qualifyingWeeks[i].split('-W').map(Number);
      const isConsecutive = (y1 === y2 && w2 - w1 === 1) || (y2 - y1 === 1 && w1 >= 52 && w2 === 1);
      if (isConsecutive) {
        running++;
        if (running > longest) longest = running;
      } else {
        running = 1;
      }
    }

    const todayISO = getTodayISO();
    const { week: curWeek, year: curYear } = getISOWeek(todayISO);
    const curWeekKey = `${curYear}-W${String(curWeek).padStart(2, '0')}`;
    const prevWeekNum = curWeek > 1 ? curWeek - 1 : 52;
    const prevYearNum = curWeek > 1 ? curYear : curYear - 1;
    const prevWeekKey = `${prevYearNum}-W${String(prevWeekNum).padStart(2, '0')}`;

    const hasCurWeek = qualifyingWeeks.includes(curWeekKey);
    const hasPrevWeek = qualifyingWeeks.includes(prevWeekKey);

    let current = 0;
    let isMaintained = false;
    let isActiveToday = false;

    if (hasCurWeek) {
      isActiveToday = true;
      isMaintained = true;
      current = 1;
      const curIdx = qualifyingWeeks.indexOf(curWeekKey);
      for (let i = curIdx - 1; i >= 0; i--) {
        const [y1, w1] = qualifyingWeeks[i].split('-W').map(Number);
        const [y2, w2] = qualifyingWeeks[i + 1].split('-W').map(Number);
        const isConsecutive = (y1 === y2 && w2 - w1 === 1) || (y2 - y1 === 1 && w1 >= 52 && w2 === 1);
        if (isConsecutive) {
          current++;
        } else {
          break;
        }
      }
    } else if (hasPrevWeek) {
      isActiveToday = false;
      isMaintained = true;
      current = 1;
      const prevIdx = qualifyingWeeks.indexOf(prevWeekKey);
      for (let i = prevIdx - 1; i >= 0; i--) {
        const [y1, w1] = qualifyingWeeks[i].split('-W').map(Number);
        const [y2, w2] = qualifyingWeeks[i + 1].split('-W').map(Number);
        const isConsecutive = (y1 === y2 && w2 - w1 === 1) || (y2 - y1 === 1 && w1 >= 52 && w2 === 1);
        if (isConsecutive) {
          current++;
        } else {
          break;
        }
      }
    }

    if (current > longest) longest = current;

    return {
      current,
      longest,
      isActiveToday,
      isMaintained,
      explanation,
    };
  }
}

/**
 * Calculates all system streaks for active settings.
 */
export function calculateAllAdvancedStreaks(
  records: DailyRecord[],
  settings: UserSettings
): {
  consistencyStreak: StreakInfo;
  goalStreak: StreakInfo;
  activityStreaks: Record<string, StreakInfo>;
} {
  const consistencyThreshold = settings.consistencyThreshold ?? 80;
  const consistencyStreak = calculateConsistencyStreak(records, consistencyThreshold);
  const goalStreak = calculateGoalStreak(records);

  const activityStreaks: Record<string, StreakInfo> = {};
  settings.disciplines.forEach((d) => {
    activityStreaks[d.id] = calculateDisciplineStreakEnhanced(records, d);
  });

  return {
    consistencyStreak,
    goalStreak,
    activityStreaks,
  };
}

// Backwards-compatible legacy exports
export function calculateDisciplineStreaks(
  records: DailyRecord[],
  discipline: ActivityDiscipline
): { current: number; longest: number } {
  const res = calculateDisciplineStreakEnhanced(records, discipline);
  return { current: res.current, longest: res.longest };
}

export function calculateStreaks(
  records: DailyRecord[],
  predicate: (r: DailyRecord) => boolean
): { current: number; longest: number } {
  const res = calculateStreakForPredicate(records, predicate, 'Legacy streak calculation');
  return { current: res.current, longest: res.longest };
}

// =========================================================================
// YEARLY PRODUCTIVITY HEATMAP ENGINE (PHASE 3)
// =========================================================================

export function generateYearlyHeatmapData(
  year: number,
  records: DailyRecord[],
  settings: UserSettings
): {
  days: HeatmapDayData[];
  weeks: (HeatmapDayData | null)[][];
  monthHeaders: { monthIndex: number; name: string; weekIndex: number }[];
  totalMinutes: number;
  activeDays: number;
  targetMetDays: number;
  avgMinutesPerActiveDay: number;
  consistencyStreak: StreakInfo;
  longestStreak: number;
} {
  const todayStr = getTodayISO();

  // Filter records for the specified year and map by date
  const yearRecordsMap: Record<string, DailyRecord> = {};
  records.forEach((r) => {
    if (r.year === year || r.date.startsWith(`${year}-`)) {
      yearRecordsMap[r.date] = r;
    }
  });

  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false);

  const days: HeatmapDayData[] = [];
  const weeks: (HeatmapDayData | null)[][] = [];

  // Determine leap year and number of days
  const leap = isLeapYear(year);
  const totalDaysInYear = leap ? 366 : 365;

  let totalMinutes = 0;
  let activeDays = 0;
  let targetMetDays = 0;

  // Track month headers
  const monthHeaders: { monthIndex: number; name: string; weekIndex: number }[] = [];
  let lastRecordedMonth = -1;

  // We arrange days in standard GitHub style: Sunday (row 0) to Saturday (row 6)
  let currentWeek: (HeatmapDayData | null)[] = [];

  const jan1 = new Date(year, 0, 1);
  const jan1DayOfWeek = jan1.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Pad week 0 before Jan 1
  for (let i = 0; i < jan1DayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Iterate through all days of the year
  const cursor = new Date(year, 0, 1);
  for (let dayIndex = 0; dayIndex < totalDaysInYear; dayIndex++) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth(); // 0-11
    const d = cursor.getDate();
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = cursor.getDay();

    const record = yearRecordsMap[dateStr];
    const hasRecord = !!record;
    const totalActual = record?.totalActual || 0;
    const totalTarget = record?.totalTarget || 0;
    const overallPct = record?.overallPct || 0;
    const isFuture = dateStr > todayStr;
    const isToday = dateStr === todayStr;

    // Intensity level:
    // Level 0: None / empty
    // Level 1: < 25% of target
    // Level 2: 25% to < 50%
    // Level 3: 50% to < 75%
    // Level 4: 75% to < 100%
    // Level 5: >= 100% (target achieved)
    let level: 0 | 1 | 2 | 3 | 4 | 5 = 0;
    if (totalActual > 0) {
      if (overallPct < 25) level = 1;
      else if (overallPct < 50) level = 2;
      else if (overallPct < 75) level = 3;
      else if (overallPct < 100) level = 4;
      else level = 5;
    }

    if (totalActual > 0) {
      totalMinutes += totalActual;
      activeDays++;
      if (overallPct >= 100 || (totalTarget > 0 && totalActual >= totalTarget)) {
        targetMetDays++;
      }
    }

    const activityList: { id: string; name: string; minutes: number; color: string }[] = [];
    if (record) {
      activeDisciplines.forEach((disc) => {
        const mins = record.activityActuals?.[disc.id] || 0;
        if (mins > 0) {
          activityList.push({
            id: disc.id,
            name: disc.name,
            minutes: mins,
            color: disc.color,
          });
        }
      });
    }

    const dayData: HeatmapDayData = {
      date: dateStr,
      dayOfWeek,
      month: m,
      dayOfMonth: d,
      year: y,
      totalActual,
      totalTarget,
      overallPct,
      level,
      hasRecord,
      isFuture,
      isToday,
      activities: activityList,
    };

    days.push(dayData);
    currentWeek.push(dayData);

    // Track month position for header labels
    if (m !== lastRecordedMonth) {
      lastRecordedMonth = m;
      const monthName = cursor.toLocaleDateString('en-US', { month: 'short' });
      monthHeaders.push({
        monthIndex: m,
        name: monthName,
        weekIndex: weeks.length,
      });
    }

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  // Pad the final week if incomplete
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const avgMinutesPerActiveDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
  const consistencyStreak = calculateConsistencyStreak(records, settings.consistencyThreshold || 80);

  return {
    days,
    weeks,
    monthHeaders,
    totalMinutes,
    activeDays,
    targetMetDays,
    avgMinutesPerActiveDay,
    consistencyStreak,
    longestStreak: consistencyStreak.longest,
  };
}

// =========================================================================
// ADVANCED PRODUCTIVITY ANALYTICS (PHASE 5)
// =========================================================================

export function filterRecordsByPeriod(
  records: DailyRecord[],
  period: TimeFilterPeriod,
  customStart?: string,
  customEnd?: string
): {
  current: DailyRecord[];
  previous: DailyRecord[];
  label: string;
  comparisonLabel: string;
} {
  const todayStr = getTodayISO();
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const now = new Date();

  if (period === 'today') {
    const yestStr = getYesterdayISO();
    return {
      current: sorted.filter((r) => r.date === todayStr),
      previous: sorted.filter((r) => r.date === yestStr),
      label: 'Today',
      comparisonLabel: 'vs Yesterday',
    };
  }

  if (period === '7d') {
    const start7 = new Date(now);
    start7.setDate(start7.getDate() - 6);
    const start7Str = start7.toISOString().slice(0, 10);

    const prevStart7 = new Date(now);
    prevStart7.setDate(prevStart7.getDate() - 13);
    const prevStart7Str = prevStart7.toISOString().slice(0, 10);

    return {
      current: sorted.filter((r) => r.date >= start7Str && r.date <= todayStr),
      previous: sorted.filter((r) => r.date >= prevStart7Str && r.date < start7Str),
      label: 'Last 7 Days',
      comparisonLabel: 'vs Previous 7 Days',
    };
  }

  if (period === '14d') {
    const start14 = new Date(now);
    start14.setDate(start14.getDate() - 13);
    const start14Str = start14.toISOString().slice(0, 10);

    const prevStart14 = new Date(now);
    prevStart14.setDate(prevStart14.getDate() - 27);
    const prevStart14Str = prevStart14.toISOString().slice(0, 10);

    return {
      current: sorted.filter((r) => r.date >= start14Str && r.date <= todayStr),
      previous: sorted.filter((r) => r.date >= prevStart14Str && r.date < start14Str),
      label: 'Last 14 Days',
      comparisonLabel: 'vs Previous 14 Days',
    };
  }

  if (period === '30d') {
    const start30 = new Date(now);
    start30.setDate(start30.getDate() - 29);
    const start30Str = start30.toISOString().slice(0, 10);

    const prevStart30 = new Date(now);
    prevStart30.setDate(prevStart30.getDate() - 59);
    const prevStart30Str = prevStart30.toISOString().slice(0, 10);

    return {
      current: sorted.filter((r) => r.date >= start30Str && r.date <= todayStr),
      previous: sorted.filter((r) => r.date >= prevStart30Str && r.date < start30Str),
      label: 'Last 30 Days',
      comparisonLabel: 'vs Previous 30 Days',
    };
  }

  if (period === 'this_week') {
    const { week: curWeek, year: curYear } = getISOWeek(todayStr);
    const prevWeek = curWeek > 1 ? curWeek - 1 : 52;
    const prevYear = curWeek > 1 ? curYear : curYear - 1;

    return {
      current: sorted.filter((r) => r.week === curWeek && r.year === curYear),
      previous: sorted.filter((r) => r.week === prevWeek && r.year === prevYear),
      label: `This Week (W${curWeek})`,
      comparisonLabel: `vs Last Week (W${prevWeek})`,
    };
  }

  if (period === 'this_month') {
    const curMonthStr = todayStr.substring(0, 7);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    return {
      current: sorted.filter((r) => r.month === curMonthStr),
      previous: sorted.filter((r) => r.month === prevMonthStr),
      label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      comparisonLabel: 'vs Last Month',
    };
  }

  if (period === 'this_year') {
    const curYear = now.getFullYear();
    const prevYear = curYear - 1;

    return {
      current: sorted.filter((r) => r.year === curYear),
      previous: sorted.filter((r) => r.year === prevYear),
      label: `Year ${curYear}`,
      comparisonLabel: `vs Year ${prevYear}`,
    };
  }

  if (period === 'custom' && customStart && customEnd) {
    return {
      current: sorted.filter((r) => r.date >= customStart && r.date <= customEnd),
      previous: [],
      label: `${customStart} to ${customEnd}`,
      comparisonLabel: '',
    };
  }

  // 'all' time
  return {
    current: sorted,
    previous: [],
    label: 'All Time Lifetime',
    comparisonLabel: '',
  };
}

export function calculatePeriodMetrics(
  periodRecords: DailyRecord[],
  settings: UserSettings
): {
  totalMinutes: number;
  targetMinutes: number;
  adherencePct: number;
  daysLogged: number;
  daysTargetMet: number;
  avgDailyMinutes: number;
  activityBreakdown: Record<string, { actualMinutes: number; targetMinutes: number; pct: number; daysActive: number }>;
} {
  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false);

  const totalMinutes = periodRecords.reduce((acc, r) => acc + r.totalActual, 0);
  const targetMinutes = periodRecords.reduce((acc, r) => acc + r.totalTarget, 0);
  const daysLogged = periodRecords.length;
  const daysTargetMet = periodRecords.filter((r) => r.overallPct >= 100 || (r.totalTarget > 0 && r.totalActual >= r.totalTarget)).length;
  const avgDailyMinutes = daysLogged > 0 ? Math.round(totalMinutes / daysLogged) : 0;
  const adherencePct = daysLogged > 0 ? Math.round(periodRecords.reduce((acc, r) => acc + r.overallPct, 0) / daysLogged) : 0;

  const activityBreakdown: Record<string, { actualMinutes: number; targetMinutes: number; pct: number; daysActive: number }> = {};
  activeDisciplines.forEach((d) => {
    let actMins = 0;
    let daysActive = 0;
    periodRecords.forEach((r) => {
      const m = r.activityActuals?.[d.id] || 0;
      if (m > 0) {
        actMins += m;
        daysActive++;
      }
    });

    const expectedMins = d.cadence === 'daily' ? d.targetMinutes * daysLogged : d.targetMinutes * Math.ceil(daysLogged / 7);
    const pct = expectedMins > 0 ? Math.round((actMins / expectedMins) * 100) : 100;

    activityBreakdown[d.id] = {
      actualMinutes: actMins,
      targetMinutes: expectedMins,
      pct,
      daysActive,
    };
  });

  return {
    totalMinutes,
    targetMinutes,
    adherencePct,
    daysLogged,
    daysTargetMet,
    avgDailyMinutes,
    activityBreakdown,
  };
}

export function calculatePersonalRecords(
  records: DailyRecord[],
  settings?: UserSettings
): {
  bestDay: { date: string; minutes: number } | null;
  bestWeek: { week: number; year: number; minutes: number } | null;
  bestMonth: { month: string; minutes: number } | null;
  topActivity: { id: string; name: string; minutes: number } | null;
  maxDailyTime: number;
} {
  if (records.length === 0) {
    return {
      bestDay: null,
      bestWeek: null,
      bestMonth: null,
      topActivity: null,
      maxDailyTime: 0,
    };
  }

  // Best day
  const sortedByTime = [...records].sort((a, b) => b.totalActual - a.totalActual);
  const bestDay = sortedByTime[0] ? { date: sortedByTime[0].date, minutes: sortedByTime[0].totalActual } : null;
  const maxDailyTime = bestDay ? bestDay.minutes : 0;

  // Best week
  const weekTotals: Record<string, { week: number; year: number; minutes: number }> = {};
  records.forEach((r) => {
    const key = `${r.year}-W${String(r.week).padStart(2, '0')}`;
    if (!weekTotals[key]) weekTotals[key] = { week: r.week, year: r.year, minutes: 0 };
    weekTotals[key].minutes += r.totalActual;
  });
  const bestWeek = Object.values(weekTotals).sort((a, b) => b.minutes - a.minutes)[0] || null;

  // Best month
  const monthTotals: Record<string, { month: string; minutes: number }> = {};
  records.forEach((r) => {
    if (!monthTotals[r.month]) monthTotals[r.month] = { month: r.month, minutes: 0 };
    monthTotals[r.month].minutes += r.totalActual;
  });
  const bestMonth = Object.values(monthTotals).sort((a, b) => b.minutes - a.minutes)[0] || null;

  // Top activity by total tracked minutes
  const actTotals: Record<string, number> = {};
  records.forEach((r) => {
    Object.keys(r.activityActuals || {}).forEach((actId) => {
      actTotals[actId] = (actTotals[actId] || 0) + (r.activityActuals[actId] || 0);
    });
  });

  let topActivity: { id: string; name: string; minutes: number } | null = null;
  let maxActMinutes = 0;
  Object.keys(actTotals).forEach((actId) => {
    if (actTotals[actId] > maxActMinutes) {
      maxActMinutes = actTotals[actId];
      const foundDisc = settings?.disciplines?.find((d) => d.id === actId);
      topActivity = {
        id: actId,
        name: foundDisc?.name || actId,
        minutes: maxActMinutes,
      };
    }
  });

  return {
    bestDay,
    bestWeek,
    bestMonth,
    topActivity,
    maxDailyTime,
  };
}

export function generateExplainableInsights(
  currentRecords: DailyRecord[],
  previousRecords: DailyRecord[] = [],
  settings: UserSettings,
  periodLabel: string
): string[] {
  const insights: string[] = [];
  const curRecords = Array.isArray(currentRecords) ? currentRecords : [];
  const prevRecords = Array.isArray(previousRecords) ? previousRecords : [];
  if (curRecords.length === 0) {
    return [
      `No activity logged for ${periodLabel}. Use 'Log Performance' to begin tracking!`,
    ];
  }

  const curTotalMins = curRecords.reduce((acc, r) => acc + r.totalActual, 0);
  const prevTotalMins = prevRecords.reduce((acc, r) => acc + r.totalActual, 0);

  // Period comparison insight
  if (prevRecords.length > 0) {
    const diffMins = curTotalMins - prevTotalMins;
    if (Math.abs(diffMins) >= 30) {
      const moreOrLess = diffMins > 0 ? 'more' : 'fewer';
      insights.push(
        `You logged ${formatMinutes(Math.abs(diffMins))} ${moreOrLess} productive time in ${periodLabel} compared to the previous period.`
      );
    }
  }

  // Goal achievement insight
  const daysTargetMet = curRecords.filter((r) => r.overallPct >= 100).length;
  if (curRecords.length > 1) {
    const pct = Math.round((daysTargetMet / curRecords.length) * 100);
    insights.push(
      `You reached 100% of your daily benchmark on ${daysTargetMet} of ${curRecords.length} recorded days (${pct}% completion rate).`
    );
  }

  // Top activity insight
  const actMins: Record<string, number> = {};
  curRecords.forEach((r) => {
    Object.keys(r.activityActuals || {}).forEach((id) => {
      actMins[id] = (actMins[id] || 0) + (r.activityActuals[id] || 0);
    });
  });

  let topActId = '';
  let topActVal = 0;
  Object.keys(actMins).forEach((id) => {
    if (actMins[id] > topActVal) {
      topActVal = actMins[id];
      topActId = id;
    }
  });

  if (topActId && topActVal > 0) {
    const disc = settings?.disciplines?.find((d) => d.id === topActId);
    insights.push(
      `${disc?.name || topActId} was your highest volume focus area, totaling ${formatMinutes(topActVal)} (${Math.round((topActVal / curTotalMins) * 100)}% of tracked time).`
    );
  }

  return insights;
}


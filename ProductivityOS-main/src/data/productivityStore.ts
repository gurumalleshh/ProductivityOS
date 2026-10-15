import { DailyRecord, UserSettings, ActivityDiscipline } from '../types';

export const POPULAR_DISCIPLINE_PRESETS: Omit<ActivityDiscipline, 'id' | 'isActive'>[] = [
  {
    name: 'Coding & Algorithms',
    tagline: 'LeetCode, data structures & computational depth',
    category: 'Technical',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#4F46E5',
    icon: 'code',
  },
  {
    name: 'Web & System Development',
    tagline: 'Shipping production code, UI features & APIs',
    category: 'Engineering',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#2563EB',
    icon: 'laptop',
  },
  {
    name: 'Morning Physical Workout',
    tagline: 'High-discipline strength, cardio & energy conditioning',
    category: 'Fitness',
    cadence: 'daily',
    targetMinutes: 60,
    color: '#059669',
    icon: 'dumbbell',
  },
  {
    name: 'Aptitude & Soft Skills',
    tagline: 'Communication, verbal reasoning & problem solving',
    category: 'Personal Growth',
    cadence: 'daily',
    targetMinutes: 30,
    color: '#7C3AED',
    icon: 'sparkles',
  },
  {
    name: 'Weekly Architecture & System Review',
    tagline: 'Deep audit of codebase, roadmap & weekly retrospective',
    category: 'Review & Strategy',
    cadence: 'weekly',
    targetMinutes: 90,
    weeklyTargetCount: 1,
    color: '#D97706',
    icon: 'calendar-check',
  },
  {
    name: 'Weekly Deep Clean & Organization',
    tagline: 'Digital workspace tidy-up, backup & priority planning',
    category: 'Organization',
    cadence: 'weekly',
    targetMinutes: 45,
    weeklyTargetCount: 1,
    color: '#0891B2',
    icon: 'check-square',
  },
  {
    name: 'Weekly Deep Run / Hike',
    tagline: 'Long distance endurance session once per week',
    category: 'Fitness',
    cadence: 'weekly',
    targetMinutes: 90,
    weeklyTargetCount: 1,
    color: '#E11D48',
    icon: 'flame',
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
  disciplines: [], // Completely empty - user can add their own activity disciplines freely!
  theme: 'light',
};

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

// Parses "1:15" or "75" into minutes
export function parseDurationInput(val: string | number): number {
  if (typeof val === 'number') return Math.max(0, val);
  if (!val || typeof val !== 'string') return 0;
  const str = val.trim();
  if (str.includes(':')) {
    const parts = str.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return Math.max(0, h * 60 + m);
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.max(0, Math.round(num));
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
  weeklyCompletedMap: Record<string, boolean> = {}
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
    id: dateStr,
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

// Streak engine: calculates current & longest streaks for daily or weekly disciplines
export function calculateDisciplineStreaks(
  records: DailyRecord[],
  discipline: ActivityDiscipline
): { current: number; longest: number } {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return { current: 0, longest: 0 };

  if (discipline.cadence === 'daily') {
    let longest = 0;
    let running = 0;

    for (let i = 0; i < sorted.length; i++) {
      const act = sorted[i].activityActuals?.[discipline.id] || 0;
      const tgt = discipline.targetMinutes;
      const meets = tgt > 0 ? act >= tgt * 0.8 : act > 0;

      if (meets) {
        running++;
        if (running > longest) longest = running;
      } else {
        running = 0;
      }
    }

    let curr = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const act = sorted[i].activityActuals?.[discipline.id] || 0;
      const tgt = discipline.targetMinutes;
      const meets = tgt > 0 ? act >= tgt * 0.8 : act > 0;
      const isToday = i === sorted.length - 1;

      if (meets) {
        curr++;
      } else {
        if (isToday) continue;
        break;
      }
    }

    return { current: curr, longest };
  } else {
    // Cadence is 'weekly' - count consecutive weeks achieved!
    // Group records by week key "YYYY-WXX"
    const weekMap: Record<string, { week: number; year: number; totalMinutes: number; completed: boolean }> = {};
    sorted.forEach((r) => {
      const key = `${r.year}-W${r.week.toString().padStart(2, '0')}`;
      if (!weekMap[key]) {
        weekMap[key] = { week: r.week, year: r.year, totalMinutes: 0, completed: false };
      }
      const act = r.activityActuals?.[discipline.id] || 0;
      weekMap[key].totalMinutes += act;
      if (r.weeklyCompleted?.[discipline.id] || (discipline.targetMinutes > 0 && weekMap[key].totalMinutes >= discipline.targetMinutes)) {
        weekMap[key].completed = true;
      }
    });

    const weekKeys = Object.keys(weekMap).sort();
    let longest = 0;
    let running = 0;

    weekKeys.forEach((k) => {
      if (weekMap[k].completed || weekMap[k].totalMinutes >= discipline.targetMinutes) {
        running++;
        if (running > longest) longest = running;
      } else {
        running = 0;
      }
    });

    let current = 0;
    for (let i = weekKeys.length - 1; i >= 0; i--) {
      const k = weekKeys[i];
      if (weekMap[k].completed || weekMap[k].totalMinutes >= discipline.targetMinutes) {
        current++;
      } else {
        break;
      }
    }

    return { current, longest };
  }
}

// Streak engine for overall productivity
export function calculateStreaks(
  records: DailyRecord[],
  predicate: (r: DailyRecord) => boolean
): { current: number; longest: number } {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let running = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (predicate(sorted[i])) {
      running++;
      if (running > longest) longest = running;
    } else {
      running = 0;
    }
  }

  let curr = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const isToday = i === sorted.length - 1;
    if (predicate(sorted[i])) {
      curr++;
    } else {
      if (isToday) continue;
      break;
    }
  }

  return { current: curr, longest };
}


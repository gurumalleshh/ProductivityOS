import React from 'react';
import { DailyRecord, UserSettings, ActivityDiscipline } from '../types';
import {
  calculateAllAdvancedStreaks,
  formatMinutes,
} from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  Flame,
  Award,
  Zap,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface StreakDashboardProps {
  records: DailyRecord[];
  settings: UserSettings;
  onSelectDiscipline?: (disciplineId: string) => void;
}

export const StreakDashboard: React.FC<StreakDashboardProps> = ({
  records,
  settings,
  onSelectDiscipline,
}) => {
  const consistencyThreshold = settings.consistencyThreshold ?? 80;
  const { consistencyStreak, goalStreak, activityStreaks } = calculateAllAdvancedStreaks(
    records,
    settings
  );

  const activeDisciplines = settings.disciplines.filter(
    (d) => d.isActive !== false && !d.isArchived
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Consistency & Streak Engine
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">
              Live Derivation
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Independently calculated streaks for daily consistency, 100% goal completion, and per-discipline mastery.
          </p>
        </div>
      </div>

      {/* Top 2 Primary Streaks: Consistency vs Goal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Daily Consistency Streak Card */}
        <div className="p-5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-linear-to-br from-amber-50/50 to-orange-50/20 dark:from-amber-950/20 dark:to-neutral-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Daily Consistency Streak
                </h3>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Threshold: ≥{consistencyThreshold}% Daily Adherence
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                consistencyStreak.isActiveToday
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : consistencyStreak.isMaintained
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {consistencyStreak.isActiveToday
                ? 'Achieved Today'
                : consistencyStreak.isMaintained
                ? 'Maintained'
                : 'Needs Activity'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-amber-100 dark:border-amber-900/40">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Current Active Streak
              </div>
              <div className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-baseline gap-1">
                <span>{consistencyStreak.current}</span>
                <span className="text-sm font-sans font-normal text-neutral-500">days</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-amber-100 dark:border-amber-900/40">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                All-Time Longest
              </div>
              <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1 flex items-baseline gap-1">
                <span>{consistencyStreak.longest}</span>
                <span className="text-sm font-sans font-normal text-neutral-500">days</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 leading-relaxed">
            {consistencyStreak.explanation} Does not penalize days currently in progress if yesterday was completed.
          </p>
        </div>

        {/* 2. Daily Goal Streak Card (100% Target) */}
        <div className="p-5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-linear-to-br from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/20 dark:to-neutral-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Daily Goal Streak (100%)
                </h3>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Target: Full Benchmark Met
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                goalStreak.isActiveToday
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : goalStreak.isMaintained
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {goalStreak.isActiveToday
                ? 'Target Met Today'
                : goalStreak.isMaintained
                ? 'Maintained'
                : 'In Progress'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Current Goal Streak
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-1">
                <span>{goalStreak.current}</span>
                <span className="text-sm font-sans font-normal text-neutral-500">days</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                All-Time Longest
              </div>
              <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1 flex items-baseline gap-1">
                <span>{goalStreak.longest}</span>
                <span className="text-sm font-sans font-normal text-neutral-500">days</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 leading-relaxed">
            {goalStreak.explanation} Requires meeting or exceeding 100% of the defined daily benchmark.
          </p>
        </div>
      </div>

      {/* 3. Per-Activity Streaks Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Per-Activity Discipline Streaks</span>
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            {activeDisciplines.length} Tracked Discipline(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {activeDisciplines.map((d) => {
            const streak = activityStreaks[d.id] || {
              current: 0,
              longest: 0,
              isActiveToday: false,
              isMaintained: false,
              explanation: '',
            };

            const isWeekly = d.cadence === 'weekly';
            const unit = isWeekly ? 'wk' : 'd';

            return (
              <div
                key={d.id}
                onClick={() => onSelectDiscipline && onSelectDiscipline(d.id)}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: d.color }}
                    >
                      <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 uppercase shrink-0">
                    {d.cadence}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-neutral-100 dark:border-neutral-700/60">
                  <div>
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">
                      Current
                    </div>
                    <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 flex items-baseline gap-0.5">
                      <span className={streak.current > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                        {streak.current}
                      </span>
                      <span className="text-[11px] font-normal text-neutral-400">{unit}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">
                      Longest
                    </div>
                    <div className="text-base font-bold font-mono text-neutral-700 dark:text-neutral-300 flex items-baseline justify-end gap-0.5">
                      <span>{streak.longest}</span>
                      <span className="text-[10px] font-normal text-neutral-400">{unit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 font-mono pt-1">
                  <span>Target: {formatMinutes(d.targetMinutes)}</span>
                  <span
                    className={`font-semibold ${
                      streak.isActiveToday
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : streak.isMaintained
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {streak.isActiveToday ? 'Done' : streak.isMaintained ? 'Active' : '0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

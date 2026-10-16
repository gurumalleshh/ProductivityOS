import React, { useState } from 'react';
import { DailyRecord, UserSettings, ActivityDiscipline } from '../types';
import {
  formatMinutes,
  calculateStreaks,
  calculateDisciplineStreaks,
  getISOWeek,
  isWeeklyDisciplineCompleted,
} from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  TrendingUp,
  Clock,
  Calendar,
  Flame,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Layers,
  Sparkles,
  Plus,
  Sun,
  Edit2,
  Target,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  onOpenLogModal: (date?: string, existing?: DailyRecord) => void;
  onOpenAddDiscipline?: () => void;
  onSelectDiscipline?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  settings,
  onOpenLogModal,
  onOpenAddDiscipline,
  onSelectDiscipline,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'7' | '14' | '30'>('14');

  // Today and yesterday records
  const todayRecord = records[0] || null;
  const yesterdayRecord = records[1] || null;

  const activeDisciplines = settings.disciplines.filter(
    (d) => d.isActive !== false && !d.isArchived
  );
  const dailyDisciplines = activeDisciplines.filter((d) => d.cadence === 'daily');
  const weeklyDisciplines = activeDisciplines.filter((d) => d.cadence === 'weekly');

  const dailyBenchmarkMinutes = dailyDisciplines.reduce((acc, d) => acc + d.targetMinutes, 0);

  // Today progress calculations
  const todayTrackedMinutes = todayRecord?.totalActual ?? 0;
  const todayTargetMinutes = todayRecord?.totalTarget || dailyBenchmarkMinutes || 255;
  const todayRemainingMinutes = Math.max(0, todayTargetMinutes - todayTrackedMinutes);
  const todayPct = todayRecord ? todayRecord.overallPct : 0;

  // Overall streaks
  const overallStreaks = calculateStreaks(records, (r) => r.overallPct >= 80);
  const goalAchievementStreak = calculateStreaks(records, (r) => r.overallPct >= 100);

  // Consistency metrics
  const daysMeetingTarget = records.filter((r) => r.overallPct >= 100).length;
  const daysMeeting80 = records.filter((r) => r.overallPct >= 80).length;

  const last7 = records.slice(0, 7);
  const avgLast7Pct =
    last7.length > 0
      ? Math.round(last7.reduce((acc, r) => acc + r.overallPct, 0) / last7.length)
      : 0;

  const last30 = records.slice(0, 30);
  const avgLast30Pct =
    last30.length > 0
      ? Math.round(last30.reduce((acc, r) => acc + r.overallPct, 0) / last30.length)
      : 0;

  // Chart data
  const limitDays = filterPeriod === '7' ? 7 : filterPeriod === '14' ? 14 : 30;
  const chronologicalSlice = [...records.slice(0, limitDays)].reverse();

  const chartData = chronologicalSlice.map((r) => ({
    date: r.date.slice(5),
    fullDate: r.date,
    overallPct: r.overallPct,
    actualHours: +(r.totalActual / 60).toFixed(2),
    targetHours: +(r.totalTarget / 60).toFixed(2),
    actualMinutes: r.totalActual,
    targetMinutes: r.totalTarget,
    status: r.status,
  }));

  // Contextual date greeting
  const todayISO = todayRecord?.date || new Date().toISOString().slice(0, 10);
  const { week: currentWeekNum, year: currentYear } = getISOWeek(todayISO);
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* A. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Overview
            </h1>
            <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">•</span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {currentDateFormatted}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {todayRecord
              ? `You have tracked ${formatMinutes(todayTrackedMinutes)} today (${todayPct}% of daily target).`
              : `Today's performance log is pending. Target benchmark: ${formatMinutes(todayTargetMinutes)}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenLogModal(todayRecord?.date || new Date().toISOString().slice(0, 10))}
            className="px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{todayRecord ? 'Update Today\'s Log' : 'Log Today\'s Performance'}</span>
          </button>
        </div>
      </div>

      {/* B. DAILY PROGRESS HERO SECTION */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left stats */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Daily Target Progress
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  todayPct >= 100
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                    : todayPct >= 80
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                    : todayPct > 0
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {todayRecord ? todayRecord.status : 'Pending'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-neutral-100">
                {formatMinutes(todayTrackedMinutes)}
              </span>
              <span className="text-sm font-mono text-neutral-400 dark:text-neutral-500">
                / {formatMinutes(todayTargetMinutes)} target
              </span>
              <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                ({todayPct}%)
              </span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-0.5">
              {todayRemainingMinutes === 0
                ? 'Daily goal fulfilled! Full discipline target achieved.'
                : `${formatMinutes(todayRemainingMinutes)} remaining to meet your 100% daily standard.`}
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 min-w-[110px]">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
                Tracked
              </span>
              <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-0.5 block">
                {formatMinutes(todayTrackedMinutes)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 min-w-[110px]">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
                Remaining
              </span>
              <span className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-0.5 block">
                {formatMinutes(todayRemainingMinutes)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 min-w-[110px]">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
                Streak Status
              </span>
              <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                {overallStreaks.current} {overallStreaks.current === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mt-5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              todayPct >= 100
                ? 'bg-emerald-500'
                : todayPct >= 80
                ? 'bg-indigo-600'
                : todayPct >= 50
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, todayPct)}%` }}
          />
        </div>
      </div>

      {/* C. ACTIVITY SUMMARY (User's Daily Disciplines) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Daily Activities ({dailyDisciplines.length})
            </h2>
            <span className="text-[11px] text-neutral-400 font-mono">
              Target: {formatMinutes(dailyBenchmarkMinutes)}
            </span>
          </div>

          {onOpenAddDiscipline && (
            <button
              onClick={onOpenAddDiscipline}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {dailyDisciplines.map((d) => {
            const actualMins = todayRecord?.activityActuals?.[d.id] ?? 0;
            const targetMins = d.targetMinutes;
            const remainingMins = Math.max(0, targetMins - actualMins);
            const pct = targetMins > 0 ? Math.round((actualMins / targetMins) * 100) : 0;
            const isCompleted = actualMins >= targetMins;

            return (
              <div
                key={d.id}
                onClick={() => onSelectDiscipline && onSelectDiscipline(d.id)}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs"
                      style={{ backgroundColor: d.color }}
                    >
                      <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded leading-none ${
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {isCompleted ? 'Done' : `${formatMinutes(remainingMins)} left`}
                    </span>
                  </div>

                  <h3 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 mt-2.5 truncate">
                    {d.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Target: {formatMinutes(targetMins)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {formatMinutes(actualMins)}
                    </span>
                    <span
                      className={`font-semibold ${
                        pct >= 100
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : pct >= 80
                          ? 'text-blue-600 dark:text-blue-400'
                          : pct > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: d.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* E. CONSISTENCY & STREAK SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            <span>80%+ Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {overallStreaks.current}
            </span>
            <span className="text-xs text-neutral-400">
              {overallStreaks.current === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400 font-mono">
            Longest: {overallStreaks.longest} days
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            <span>100% Goal Streak</span>
            <Award className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {goalAchievementStreak.current}
            </span>
            <span className="text-xs text-neutral-400">
              {goalAchievementStreak.current === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400 font-mono">
            {daysMeetingTarget} days total met
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            <span>7-Day Average</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {avgLast7Pct}%
            </span>
            <span className="text-xs text-neutral-400">/ 80% goal</span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            {avgLast7Pct >= 80 ? '✓ Meeting standard' : 'Below benchmark'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            <span>30-Day Average</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {avgLast30Pct}%
            </span>
            <span className="text-xs text-neutral-400">adherence</span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            Across {Math.min(30, records.length)} logged days
          </div>
        </div>
      </div>

      {/* D. PRODUCTIVITY TREND & F. RECENT ACTIVITY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Chart (Takes 2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Productivity Trend
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Daily completion percentage against the 80% discipline line
              </p>
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-800 text-xs font-medium">
              {(['7', '14', '30'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                    filterPeriod === p
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {p}D
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 w-full flex items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-400 font-mono">
              Awaiting first daily log entry
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 120]} stroke="#9CA3AF" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-neutral-900 dark:bg-neutral-800 text-white p-2.5 rounded-lg text-xs font-mono shadow-xl border border-neutral-700">
                            <div className="font-sans font-semibold text-neutral-300">{d.fullDate}</div>
                            <div className="text-indigo-400 font-bold text-sm mt-0.5">
                              Score: {d.overallPct}% ({d.status})
                            </div>
                            <div className="text-neutral-400 text-[11px] mt-1">
                              Delivered: {formatMinutes(d.actualMinutes)} / {formatMinutes(d.targetMinutes)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overallPct"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#4F46E5' }}
                    activeDot={{ r: 5, fill: '#6366F1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity List (Takes 1 Column) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Recent Logs
              </h2>
              <span className="text-[10px] font-mono text-neutral-400">Click to edit</span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              History of your latest daily entries
            </p>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-72">
            {records.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">
                No records logged yet.
              </div>
            ) : (
              records.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  onClick={() => onOpenLogModal(r.date, r)}
                  className="p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-100/60 dark:hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {r.date}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {r.day.slice(0, 3)}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : r.status === 'GOOD'
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                            : r.status === 'PARTIAL'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-1">
                      {formatMinutes(r.totalActual)} ({r.overallPct}%)
                    </div>
                  </div>

                  <div className="p-1 rounded text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => onOpenLogModal()}
              className="w-full py-1.5 text-xs text-center font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Log another day</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

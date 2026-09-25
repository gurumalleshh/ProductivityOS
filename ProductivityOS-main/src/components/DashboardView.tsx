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
  onOpenLogModal: (date?: string) => void;
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
  const [filterPeriod, setFilterPeriod] = useState<'7' | '14' | '30' | 'all'>('30');

  // Default records order is newest first
  const todayRecord = records[0] || null;
  const yesterdayRecord = records[1] || null;

  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false);
  const dailyDisciplines = activeDisciplines.filter((d) => d.cadence === 'daily');
  const weeklyDisciplines = activeDisciplines.filter((d) => d.cadence === 'weekly');

  const dailyBenchmarkMinutes = dailyDisciplines.reduce((acc, d) => acc + d.targetMinutes, 0);

  // Overall streaks
  const overallStreaks = calculateStreaks(records, (r) => r.overallPct >= 80);

  // Dynamic discipline streaks
  const disciplineStreaksMap: Record<string, { current: number; longest: number }> = {};
  activeDisciplines.forEach((d) => {
    disciplineStreaksMap[d.id] = calculateDisciplineStreaks(records, d);
  });

  // Time-slice calculations
  const last7 = records.slice(0, 7);
  const avgLast7Pct =
    last7.length > 0
      ? Math.round(last7.reduce((acc, r) => acc + r.overallPct, 0) / last7.length)
      : 0;

  const currentMonthStr = todayRecord?.month || new Date().toISOString().slice(0, 7);
  const thisMonthRecords = records.filter((r) => r.month === currentMonthStr);
  const avgMonthPct =
    thisMonthRecords.length > 0
      ? Math.round(
          thisMonthRecords.reduce((acc, r) => acc + r.overallPct, 0) /
            thisMonthRecords.length
        )
      : 0;

  const totalLifetimeMinutes = records.reduce((acc, r) => acc + r.totalActual, 0);

  // Chart data: chronological ascending
  const limitDays =
    filterPeriod === '7'
      ? 7
      : filterPeriod === '14'
      ? 14
      : filterPeriod === '30'
      ? 30
      : records.length;
  const chronologicalSlice = [...records.slice(0, limitDays)].reverse();

  const chartData = chronologicalSlice.map((r) => {
    const entry: Record<string, any> = {
      date: r.date.slice(5),
      fullDate: r.date,
      overallPct: r.overallPct,
      actualHours: +(r.totalActual / 60).toFixed(2),
      targetHours: +(r.totalTarget / 60).toFixed(2),
    };

    activeDisciplines.forEach((d) => {
      const act = r.activityActuals?.[d.id] ?? 0;
      entry[d.id] = +(act / 60).toFixed(2);
    });

    return entry;
  });

  // Personal Records
  const bestDayRecord = [...records].sort((a, b) => b.totalActual - a.totalActual)[0];

  // Current ISO week
  const todayISO = todayRecord?.date || new Date().toISOString().slice(0, 10);
  const { week: currentWeekNum, year: currentYear } = getISOWeek(todayISO);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top SaaS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              MY PRODUCTIVITY OPERATING SYSTEM
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
              Active Disciplines: {activeDisciplines.length}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Lifetime personal analytics and execution tracking • Benchmark:{' '}
            <span className="font-mono font-semibold text-neutral-700">
              {formatMinutes(dailyBenchmarkMinutes)} / day
            </span>
            {weeklyDisciplines.length > 0 && (
              <span> + {weeklyDisciplines.length} weekly special discipline(s)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick period toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-neutral-200 bg-neutral-100/80 text-xs font-medium text-neutral-600">
            {(['7', '14', '30', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriod(p)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterPeriod === p
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'hover:text-neutral-900'
                }`}
              >
                {p === 'all' ? 'Lifetime' : `${p}D`}
              </button>
            ))}
          </div>

          {onOpenAddDiscipline && (
            <button
              onClick={onOpenAddDiscipline}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Discipline</span>
            </button>
          )}

          <button
            onClick={() => onOpenLogModal(todayRecord?.date || new Date().toISOString().slice(0, 10))}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Today</span>
            <span className="font-mono text-[10px] text-neutral-400">
              ({todayRecord?.date || new Date().toISOString().slice(0, 10)})
            </span>
          </button>
        </div>
      </div>

      {/* KPI ROW - 6 Standard Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Today Completion */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Today's Score</span>
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900">
              {todayRecord ? todayRecord.overallPct : 0}%
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {todayRecord
                ? `${formatMinutes(todayRecord.totalActual)}`
                : 'No log'}
            </span>
          </div>
          <div className="mt-2 text-[11px]">
            {todayRecord ? (
              <span
                className={`font-semibold ${
                  todayRecord.overallPct >= 100
                    ? 'text-emerald-600'
                    : todayRecord.overallPct >= 80
                    ? 'text-blue-600'
                    : 'text-amber-600'
                }`}
              >
                {todayRecord.status}
              </span>
            ) : (
              <span className="text-neutral-400">Log pending today</span>
            )}
          </div>
        </div>

        {/* 2. 7-Day Average */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>7-Day Average</span>
            <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900">
              {avgLast7Pct}%
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              / 80% goal
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {avgLast7Pct >= 80 ? (
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Target met
              </span>
            ) : (
              <span className="text-amber-600 font-medium flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> Needs push
              </span>
            )}
          </div>
        </div>

        {/* 3. Current Streak */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900">
              {overallStreaks.current}
            </span>
            <span className="text-xs text-neutral-400">
              {overallStreaks.current === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            Best: {overallStreaks.longest} days
          </div>
        </div>

        {/* 4. Month Adherence */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Month Pace</span>
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900">
              {avgMonthPct}%
            </span>
            <span className="text-[11px] text-neutral-400">
              ({thisMonthRecords.length}d logged)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Current calendar month
          </div>
        </div>

        {/* 5. Lifetime Delivered */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Lifetime Logged</span>
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900">
              {Math.round(totalLifetimeMinutes / 60)}h
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {totalLifetimeMinutes % 60}m
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            Across {records.length} logged days
          </div>
        </div>

        {/* 6. Active Disciplines */}
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
            <span>Disciplines</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-neutral-900">
              {activeDisciplines.length}
            </span>
            <span className="text-xs text-neutral-400 font-mono">configured</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            {dailyDisciplines.length} Daily • {weeklyDisciplines.length} Weekly
          </div>
        </div>
      </div>

      {/* DISCIPLINE CARDS - DAILY DISCIPLINE GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Activity Disciplines ({dailyDisciplines.length})</span>
          </div>
          {onOpenAddDiscipline && (
            <button
              onClick={onOpenAddDiscipline}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Discipline</span>
            </button>
          )}
        </div>

        {dailyDisciplines.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-neutral-200 text-center bg-white">
            <p className="text-xs text-neutral-500 mb-2">
              No daily disciplines configured yet.
            </p>
            {onOpenAddDiscipline && (
              <button
                onClick={onOpenAddDiscipline}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Daily Discipline</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {dailyDisciplines.map((d) => {
              const actualMins = todayRecord?.activityActuals?.[d.id] ?? 0;
              const pct =
                todayRecord?.activityPercentages?.[d.id] ??
                (d.targetMinutes > 0 ? Math.round((actualMins / d.targetMinutes) * 100) : 0);
              const streak = disciplineStreaksMap[d.id] || { current: 0, longest: 0 };

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectDiscipline && onSelectDiscipline(d.id)}
                  className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs"
                        style={{ backgroundColor: d.color }}
                      >
                        <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {formatMinutes(d.targetMinutes)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-neutral-900 mt-2.5 truncate">
                      {d.name}
                    </h4>
                    {d.tagline && (
                      <p className="text-[11px] text-neutral-400 leading-tight truncate mt-0.5">
                        {d.tagline}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold font-mono text-neutral-900">
                        {formatMinutes(actualMins)}
                      </span>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          pct >= 100
                            ? 'text-emerald-600'
                            : pct >= 80
                            ? 'text-blue-600'
                            : pct >= 50
                            ? 'text-amber-600'
                            : 'text-neutral-400'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-2">
                      <span>Streak: {streak.current}d</span>
                      <span>Best: {streak.longest}d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WEEKLY SPECIAL ACTIVITIES ("ONCE A WEEK") SECTION */}
      {weeklyDisciplines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Weekly Special Activities (Once-a-Week Cadence)</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              Week {currentWeekNum}, {currentYear}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {weeklyDisciplines.map((d) => {
              const weekStatus = isWeeklyDisciplineCompleted(
                records,
                d.id,
                currentWeekNum,
                currentYear
              );
              const streak = disciplineStreaksMap[d.id] || { current: 0, longest: 0 };

              return (
                <div
                  key={d.id}
                  onClick={() => onSelectDiscipline && onSelectDiscipline(d.id)}
                  className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs"
                          style={{ backgroundColor: d.color }}
                        >
                          <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-neutral-900 truncate" title={d.name}>
                            {d.name}
                          </h4>
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded leading-none whitespace-nowrap inline-block mt-0.5">
                            Weekly Cadence
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 whitespace-nowrap shrink-0">
                        Target: {formatMinutes(d.targetMinutes)}
                      </span>
                    </div>

                    {d.tagline && (
                      <p className="text-[11px] text-neutral-400 leading-tight mt-2.5">
                        {d.tagline}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-600">This Week Status:</span>
                      {weekStatus.completed ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Fulfilled ({formatMinutes(weekStatus.totalMinutes)})</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                          Pending This Week
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                      <span>Weekly Streak: {streak.current} wks 🔥</span>
                      <span>Best: {streak.longest} wks</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trend Chart */}
        <div className="p-5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                DAILY ADHERENCE TREND
              </h3>
              <p className="text-xs text-neutral-500">
                Overall % score vs the 80% discipline standard
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Performance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-500" />
                <span>80% Goal</span>
              </div>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-60 w-full flex items-center justify-center border border-dashed border-neutral-200 rounded-lg text-xs text-neutral-400 font-mono">
              Awaiting first daily log entry
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 120]} stroke="#9CA3AF" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-neutral-900 text-white p-2.5 rounded-lg text-xs font-mono shadow-xl border border-neutral-800">
                            <div className="font-sans font-semibold text-neutral-300 mb-1">
                              {data.fullDate}
                            </div>
                            <div className="text-indigo-400 font-bold text-sm">
                              Score: {data.overallPct}%
                            </div>
                            <div className="text-neutral-400 mt-1">
                              Delivered: {data.actualHours}h / {data.targetHours}h
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
                    dot={{ r: 2, fill: '#4F46E5' }}
                    activeDot={{ r: 5, fill: '#312E81' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Target vs Actual Hours */}
        <div className="p-5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                TARGET VS ACTUAL HOURS
              </h3>
              <p className="text-xs text-neutral-500">
                Delivered hours against configured discipline benchmarks
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-neutral-900" />
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-neutral-200" />
                <span>Target</span>
              </div>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-60 w-full flex items-center justify-center border border-dashed border-neutral-200 rounded-lg text-xs text-neutral-400 font-mono">
              Awaiting first daily log entry
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.slice(-14)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} unit="h" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-neutral-900 text-white p-2.5 rounded-lg text-xs font-mono">
                            <div className="text-neutral-400">{d.fullDate}</div>
                            <div className="text-emerald-400 font-bold">
                              Actual: {d.actualHours}h
                            </div>
                            <div className="text-neutral-400">Target: {d.targetHours}h</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="targetHours" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualHours" fill="#0F172A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* PERSONAL RECORDS SUMMARY */}
      <div className="p-5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
            Personal Records & Lifetime Bests
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="text-[10px] text-neutral-400 uppercase font-semibold">
              Most Productive Day
            </div>
            <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
              {bestDayRecord ? formatMinutes(bestDayRecord.totalActual) : '0m'}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              {bestDayRecord?.date || '—'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="text-[10px] text-neutral-400 uppercase font-semibold">
              Longest 80%+ Streak
            </div>
            <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
              {overallStreaks.longest} Days
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">Unbroken streak</div>
          </div>

          {activeDisciplines.slice(0, 2).map((d) => {
            const streak = disciplineStreaksMap[d.id] || { current: 0, longest: 0 };
            return (
              <div
                key={`record-${d.id}`}
                className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60"
              >
                <div className="text-[10px] text-neutral-400 uppercase font-semibold truncate">
                  Best {d.name} Streak
                </div>
                <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
                  {streak.longest} {d.cadence === 'weekly' ? 'Weeks' : 'Days'}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {d.cadence === 'weekly' ? 'Consecutive weeks' : 'Daily discipline'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

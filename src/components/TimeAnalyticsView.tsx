import React, { useState } from 'react';
import { DailyRecord, UserSettings } from '../types';
import { formatMinutes } from '../data/productivityStore';
import {
  CalendarRange,
  CalendarCheck2,
  Calendar,
  TrendingUp,
  BarChart3,
  Award,
  Flame,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

interface TimeAnalyticsViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  mode: 'weekly' | 'monthly' | 'yearly';
}

export const TimeAnalyticsView: React.FC<TimeAnalyticsViewProps> = ({
  records,
  settings,
  mode,
}) => {
  if (records.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
              {mode} ANALYTICS & TRENDS
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {mode === 'weekly' ? 'Sheet 04' : mode === 'monthly' ? 'Sheet 05' : 'Sheet 06'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Aggregated performance cadence across {mode} timelines.
          </p>
        </div>

        <div className="p-16 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 text-center flex flex-col items-center justify-center">
          <Calendar className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            No {mode.charAt(0).toUpperCase() + mode.slice(1)} Records Found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mt-1.5 leading-relaxed">
            Record your daily sessions in Sheet 03 (Daily Tracker) to automatically generate {mode} aggregate performance metrics and charts.
          </p>
        </div>
      </div>
    );
  }

  // Grouping logic based on mode
  if (mode === 'weekly') {
    // Unique weeks
    const weekMap: { [wk: string]: DailyRecord[] } = {};
    records.forEach((r) => {
      const key = `W${r.week.toString().padStart(2, '0')} (${r.year})`;
      if (!weekMap[key]) weekMap[key] = [];
      weekMap[key].push(r);
    });

    const weekKeys = Object.keys(weekMap).sort().reverse();
    const [selectedWeek, setSelectedWeek] = useState<string>(weekKeys[0] || '');
    const activeWeekRecords = weekMap[selectedWeek] || [];

    const weekTotalMins = activeWeekRecords.reduce((acc, r) => acc + r.totalActual, 0);
    const weekTargetMins = activeWeekRecords.reduce((acc, r) => acc + r.totalTarget, 0);
    const weekAvgPct = activeWeekRecords.length
      ? Math.round(activeWeekRecords.reduce((acc, r) => acc + r.overallPct, 0) / activeWeekRecords.length)
      : 0;
    const completedDays = activeWeekRecords.filter((r) => r.status === 'COMPLETED' || r.overallPct >= 100).length;

    const chartData = [...activeWeekRecords].reverse().map((r) => ({
      day: r.day.slice(0, 3),
      date: r.date,
      actualHours: +(r.totalActual / 60).toFixed(2),
      targetHours: +(r.totalTarget / 60).toFixed(2),
      pct: r.overallPct,
    }));

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header with Week Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                WEEKLY ANALYTICS & CONSISTENCY
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Sheet 04
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Micro-consistency review across 7-day rhythms. Identifies momentum drops before they compound.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">Select Week:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-neutral-900"
            >
              {weekKeys.map((wk) => (
                <option key={wk} value={wk}>
                  {wk} ({weekMap[wk].length} days)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6 Weekly KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Weekly Hours</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{formatMinutes(weekTotalMins)}</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Actual logged</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Weekly Target</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{formatMinutes(weekTargetMins)}</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Based on active days</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Completion %</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{weekAvgPct}%</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Average score</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">100% Days</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{completedDays} / {activeWeekRecords.length}</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Target hit</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Avg Daily Time</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {formatMinutes(activeWeekRecords.length ? Math.round(weekTotalMins / activeWeekRecords.length) : 0)}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Per active day</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Consistency</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {Math.round((completedDays / (activeWeekRecords.length || 1)) * 100)}%
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Adherence rating</div>
          </div>
        </div>

        {/* Charts: Target vs Actual & Day-by-day */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">WEEKLY DAILY HOURS DISTRIBUTION</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#FFF' }}
                  />
                  <Bar dataKey="targetHours" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Target" />
                  <Bar dataKey="actualHours" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Actual Logged" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">COMPLETION TREND (% ACROSS WEEK)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                  <YAxis domain={[0, 120]} stroke="#9CA3AF" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#FFF' }}
                  />
                  <Line type="monotone" dataKey="pct" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} name="Score %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'monthly') {
    // Unique months
    const monthMap: { [m: string]: DailyRecord[] } = {};
    records.forEach((r) => {
      if (!monthMap[r.month]) monthMap[r.month] = [];
      monthMap[r.month].push(r);
    });

    const monthKeys = Object.keys(monthMap).sort().reverse();
    const [selectedMonth, setSelectedMonth] = useState<string>(monthKeys[0] || '');
    const activeRecords = monthMap[selectedMonth] || [];

    const monthTotalMins = activeRecords.reduce((acc, r) => acc + r.totalActual, 0);
    const monthTargetMins = activeRecords.reduce((acc, r) => acc + r.totalTarget, 0);
    const monthAvgPct = activeRecords.length
      ? Math.round(activeRecords.reduce((acc, r) => acc + r.overallPct, 0) / activeRecords.length)
      : 0;
    const bestDay = [...activeRecords].sort((a, b) => b.totalActual - a.totalActual)[0];

    const chartData = [...activeRecords].reverse().map((r) => ({
      date: r.date.slice(8), // day of month
      fullDate: r.date,
      actualHours: +(r.totalActual / 60).toFixed(2),
      pct: r.overallPct,
    }));

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                MONTHLY ANALYTICS & EXECUTIVE CADENCE
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Sheet 05
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Monthly executive review: target adherence, volume logged, best day records, and pace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">Select Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:ring-1 focus:ring-neutral-900"
            >
              {monthKeys.map((m) => (
                <option key={m} value={m}>
                  {m} ({monthMap[m].length} days)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6 Monthly KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Monthly Hours</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{Math.round(monthTotalMins / 60)}h</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Total time</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Monthly Target</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{Math.round(monthTargetMins / 60)}h</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Required standard</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Completion %</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{monthAvgPct}%</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Monthly average</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Days Tracked</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{activeRecords.length}</div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Logs recorded</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Days &gt;= 80%</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {activeRecords.filter((r) => r.overallPct >= 80).length}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">Streak standard</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Best Day</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {bestDay ? formatMinutes(bestDay.totalActual) : '0m'}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">{bestDay?.date.slice(5) || '—'}</div>
          </div>
        </div>

        {/* Daily Progression Chart across month */}
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">DAILY PRODUCTIVITY SPREAD ACROSS {selectedMonth}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#FFF' }}
                />
                <Bar dataKey="actualHours" fill="#0F172A" className="dark:fill-indigo-500" radius={[3, 3, 0, 0]} name="Hours Logged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // Yearly Review
  const yearMap: { [y: number]: DailyRecord[] } = {};
  records.forEach((r) => {
    if (!yearMap[r.year]) yearMap[r.year] = [];
    yearMap[r.year].push(r);
  });
  const years = Object.keys(yearMap).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            YEARLY ARCHIVE & LIFETIME COMPOUNDING
          </h1>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Sheet 06
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Designed for 2026, 2027, 2028, and beyond without ever duplicating workbooks or rewriting formulas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {years.map((yr) => {
          const yrRecords = yearMap[yr] || [];
          const totalMins = yrRecords.reduce((acc, r) => acc + r.totalActual, 0);
          const avgPct = yrRecords.length
            ? Math.round(yrRecords.reduce((acc, r) => acc + r.overallPct, 0) / yrRecords.length)
            : 0;

          return (
            <div key={yr} className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{yr}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                  {yrRecords.length} Days Logged
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <div className="text-neutral-400 text-[10px]">TOTAL PRODUCTIVE</div>
                  <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">{Math.round(totalMins / 60)}h</div>
                </div>
                <div>
                  <div className="text-neutral-400 text-[10px]">AVG ADHERENCE</div>
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">{avgPct}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

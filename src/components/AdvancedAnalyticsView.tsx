import React, { useState, useMemo, useEffect } from 'react';
import { DailyRecord, UserSettings, TimeFilterPeriod } from '../types';
import {
  filterRecordsByPeriod,
  calculatePeriodMetrics,
  calculatePersonalRecords,
  generateExplainableInsights,
  calculateDisciplineStreakEnhanced,
  formatMinutes,
} from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  BarChart3,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  CalendarRange,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AdvancedAnalyticsViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  initialPeriod?: TimeFilterPeriod;
  onOpenLogModal?: (date?: string) => void;
  onSelectDiscipline?: (disciplineId: string) => void;
}

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
  records,
  settings,
  initialPeriod,
  onOpenLogModal,
  onSelectDiscipline,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFilterPeriod>(initialPeriod || '30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  useEffect(() => {
    if (initialPeriod) {
      setSelectedPeriod(initialPeriod);
    }
  }, [initialPeriod]);

  // Filter records based on selected period
  const { current: periodRecords, previous: previousRecords, label: periodLabel, comparisonLabel } = useMemo(() => {
    return filterRecordsByPeriod(records, selectedPeriod, customStart, customEnd);
  }, [records, selectedPeriod, customStart, customEnd]);

  // Current period metrics
  const currentMetrics = useMemo(() => {
    return calculatePeriodMetrics(periodRecords, settings);
  }, [periodRecords, settings]);

  // Previous period metrics for comparison
  const previousMetrics = useMemo(() => {
    return calculatePeriodMetrics(previousRecords, settings);
  }, [previousRecords, settings]);

  // Personal lifetime records
  const personalRecords = useMemo(() => {
    return calculatePersonalRecords(records, settings);
  }, [records, settings]);

  // Dynamic explainable insights
  const insights = useMemo(() => {
    return generateExplainableInsights(periodRecords, previousRecords, settings, periodLabel);
  }, [periodRecords, previousRecords, settings, periodLabel]);

  // Chart data: Planned vs Actual across current period (chronological ascending)
  const chartData = useMemo(() => {
    const sortedAsc = [...periodRecords].sort((a, b) => a.date.localeCompare(b.date));
    return sortedAsc.map((r) => {
      const entry: Record<string, any> = {
        date: r.date.slice(5),
        fullDate: r.date,
        actualHours: +(r.totalActual / 60).toFixed(2),
        targetHours: +(r.totalTarget / 60).toFixed(2),
        pct: r.overallPct,
      };
      return entry;
    });
  }, [periodRecords]);

  // Comparison deltas
  const diffMinutes = currentMetrics.totalMinutes - previousMetrics.totalMinutes;
  const diffAdherence = currentMetrics.adherencePct - previousMetrics.adherencePct;

  const activeDisciplines = settings.disciplines.filter(
    (d) => d.isActive !== false && !d.isArchived
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              ADVANCED PRODUCTIVITY ANALYTICS
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Period: {periodLabel}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Planned vs. actual execution tracking, period comparisons, activity deep-dives, and real data insights.
          </p>
        </div>

        {/* Time Period Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 text-xs font-medium">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7D' },
              { id: '14d', label: '14D' },
              { id: '30d', label: '30D' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPeriod(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-sans ${
                selectedPeriod === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Pickers if 'custom' is active */}
      {selectedPeriod === 'custom' && (
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>
      )}

      {/* Top Key Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Actual Hours with Period Delta */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <span>Tracked Time</span>
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {formatMinutes(currentMetrics.totalMinutes)}
          </div>
          {comparisonLabel && previousRecords.length > 0 && (
            <div className={`flex items-center gap-1 text-[11px] font-mono font-medium ${
              diffMinutes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {diffMinutes >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{diffMinutes >= 0 ? '+' : ''}{formatMinutes(diffMinutes)} {comparisonLabel}</span>
            </div>
          )}
        </div>

        {/* Planned Target Time */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <span>Planned Target</span>
            <Target className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {formatMinutes(currentMetrics.targetMinutes)}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            {currentMetrics.totalMinutes >= currentMetrics.targetMinutes ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Target met in full</span>
            ) : (
              <span>Remaining: {formatMinutes(currentMetrics.targetMinutes - currentMetrics.totalMinutes)}</span>
            )}
          </div>
        </div>

        {/* Adherence Percentage with Comparison */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <span>Target Adherence</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {currentMetrics.adherencePct}%
          </div>
          {comparisonLabel && previousRecords.length > 0 && (
            <div className={`flex items-center gap-1 text-[11px] font-mono font-medium ${
              diffAdherence >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {diffAdherence >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{diffAdherence >= 0 ? '+' : ''}{diffAdherence}% {comparisonLabel}</span>
            </div>
          )}
        </div>

        {/* Target Met Days */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <span>100% Target Met</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {currentMetrics.daysTargetMet} <span className="text-sm font-sans font-normal text-neutral-400">/ {currentMetrics.daysLogged} days</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            Daily target standard
          </div>
        </div>
      </div>

      {/* Explainable Insights Banner */}
      {insights.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>AI & Mathematical Insights for {periodLabel}</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-sans">
            {insights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Planned vs Actual Trend Chart */}
      <div className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
              Planned Target vs. Actual Tracked Time
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Comparison between your scheduled daily target benchmarks and actual logged hours.
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 font-mono">
            No records found in this time range. Click 'Log Performance' to log sessions.
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} unit="h" />
                <Tooltip
                  formatter={(val: any) => [`${val} hours`, '']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="targetHours" fill="#94A3B8" radius={[3, 3, 0, 0]} name="Planned Target (h)" />
                <Bar dataKey="actualHours" fill="#4F46E5" radius={[3, 3, 0, 0]} name="Actual Logged (h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Activity-by-Activity Deep Breakdown */}
      <div className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
              Discipline Analysis & Adherence Breakdown
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Target adherence, recorded sessions, and current streaks for each active productivity goal.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {activeDisciplines.length} Disciplines
          </span>
        </div>

        <div className="space-y-4">
          {activeDisciplines.map((d) => {
            const data = currentMetrics.activityBreakdown[d.id] || {
              actualMinutes: 0,
              targetMinutes: 0,
              pct: 0,
              daysActive: 0,
            };

            const streak = calculateDisciplineStreakEnhanced(records, d);
            const remainingMins = Math.max(0, data.targetMinutes - data.actualMinutes);
            const isTargetMet = data.actualMinutes >= data.targetMinutes && data.targetMinutes > 0;

            return (
              <div
                key={d.id}
                onClick={() => onSelectDiscipline && onSelectDiscipline(d.id)}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: d.color }}
                    >
                      <DisciplineIcon name={d.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {d.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                          {d.cadence} ({formatMinutes(d.targetMinutes)}/{d.cadence === 'weekly' ? 'wk' : 'day'})
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{d.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-neutral-400 text-[10px] uppercase block">Streak</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {streak.current}{d.cadence === 'weekly' ? 'w' : 'd'} (max {streak.longest})
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 text-[10px] uppercase block">Actual / Target</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {formatMinutes(data.actualMinutes)} / {formatMinutes(data.targetMinutes)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-400 text-[10px] uppercase block">Adherence</span>
                      <span className={`font-bold ${data.pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                        {data.pct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, data.pct)}%`,
                        backgroundColor: d.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>{data.daysActive} active days recorded in period</span>
                    <span>
                      {isTargetMet ? 'Goal achieved in period' : `Need ${formatMinutes(remainingMins)} to reach target`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lifetime Personal Records */}
      <div className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
            Lifetime Personal Records (All-Time)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Most Productive Day
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {personalRecords.bestDay ? formatMinutes(personalRecords.bestDay.minutes) : '0m'}
            </div>
            <div className="text-xs text-neutral-500 font-mono mt-0.5">
              {personalRecords.bestDay?.date || 'No records'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Best Productive Week
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {personalRecords.bestWeek ? formatMinutes(personalRecords.bestWeek.minutes) : '0m'}
            </div>
            <div className="text-xs text-neutral-500 font-mono mt-0.5">
              {personalRecords.bestWeek ? `Week ${personalRecords.bestWeek.week} (${personalRecords.bestWeek.year})` : 'No records'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Best Productive Month
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
              {personalRecords.bestMonth ? formatMinutes(personalRecords.bestMonth.minutes) : '0m'}
            </div>
            <div className="text-xs text-neutral-500 font-mono mt-0.5">
              {personalRecords.bestMonth?.month || 'No records'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Highest Volume Discipline
            </div>
            <div className="text-xl font-bold font-sans text-neutral-900 dark:text-neutral-100 mt-1 truncate">
              {personalRecords.topActivity?.name || '—'}
            </div>
            <div className="text-xs text-neutral-500 font-mono mt-0.5">
              {personalRecords.topActivity ? formatMinutes(personalRecords.topActivity.minutes) : '0m tracked'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

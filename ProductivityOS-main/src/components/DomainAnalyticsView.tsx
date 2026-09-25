import React, { useState } from 'react';
import { DailyRecord, UserSettings, ActivityDiscipline } from '../types';
import {
  formatMinutes,
  calculateDisciplineStreaks,
  getISOWeek,
  isWeeklyDisciplineCompleted,
} from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import { ConfirmModal } from './ConfirmModal';
import {
  Flame,
  Award,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Sun,
  CheckCircle2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DomainAnalyticsViewProps {
  activityId: string;
  records: DailyRecord[];
  settings: UserSettings;
  onEditDiscipline?: (discipline: ActivityDiscipline) => void;
  onDeleteDiscipline?: (id: string) => void;
}

export const DomainAnalyticsView: React.FC<DomainAnalyticsViewProps> = ({
  activityId,
  records,
  settings,
  onEditDiscipline,
  onDeleteDiscipline,
}) => {
  // Find discipline by ID, or fallback
  const discipline: ActivityDiscipline =
    settings.disciplines.find((d) => d.id === activityId) || {
      id: activityId,
      name: activityId.charAt(0).toUpperCase() + activityId.slice(1),
      cadence: 'daily',
      targetMinutes: 60,
      color: '#4F46E5',
      icon: 'activity',
      category: 'General',
      isActive: true,
      tagline: 'Custom activity discipline',
    };

  const isWeekly = discipline.cadence === 'weekly';
  const streaks = calculateDisciplineStreaks(records, discipline);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const getActual = (r: DailyRecord) => r.activityActuals?.[discipline.id] ?? 0;
  const getPct = (r: DailyRecord) =>
    r.activityPercentages?.[discipline.id] ??
    (discipline.targetMinutes > 0
      ? Math.round((getActual(r) / discipline.targetMinutes) * 100)
      : 0);

  const totalMins = records.reduce((acc, r) => acc + getActual(r), 0);
  const activeLogsCount = records.filter((r) => getActual(r) > 0).length;
  const avgMins = records.length ? Math.round(totalMins / records.length) : 0;
  const avgPct = records.length
    ? Math.round(records.reduce((acc, r) => acc + getPct(r), 0) / records.length)
    : 0;

  // Chronological chart data
  let runningCumulativeMinutes = 0;
  const chronological = [...records].reverse().map((r) => {
    const act = getActual(r);
    runningCumulativeMinutes += act;
    return {
      date: r.date.slice(5),
      fullDate: r.date,
      actualHours: +(act / 60).toFixed(2),
      cumulativeHours: +(runningCumulativeMinutes / 60).toFixed(1),
      pct: getPct(r),
      targetHours: +(discipline.targetMinutes / 60).toFixed(2),
    };
  });

  const todayISO = records[0]?.date || new Date().toISOString().slice(0, 10);
  const { week: currentWeekNum, year: currentYear } = getISOWeek(todayISO);
  const weekStatus = isWeekly
    ? isWeeklyDisciplineCompleted(records, discipline.id, currentWeekNum, currentYear)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: discipline.color }}
            >
              <DisciplineIcon name={discipline.icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                  {discipline.name.toUpperCase()} ANALYTICS
                </h1>
                <span
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                    isWeekly
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                  }`}
                >
                  {isWeekly ? 'Weekly Special' : 'Daily Cadence'}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  • {discipline.category}
                </span>
              </div>
              {discipline.tagline && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  "{discipline.tagline}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="text-right">
              <div className="text-[10px] text-neutral-400 font-mono uppercase">
                {isWeekly ? 'Weekly Target' : 'Daily Target'}
              </div>
              <div className="text-base font-bold font-mono text-neutral-900">
                {formatMinutes(discipline.targetMinutes)} {isWeekly ? '/ week' : '/ day'}
              </div>
            </div>

            {onEditDiscipline && (
              <button
                type="button"
                onClick={() => onEditDiscipline(discipline)}
                className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                title="Edit Discipline Settings"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {onDeleteDiscipline && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-2 rounded-lg border border-neutral-200 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete Discipline"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Banner if Weekly Cadence */}
      {isWeekly && weekStatus && (
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <div>
              <div className="text-xs font-semibold text-indigo-950">
                Weekly Special Activity Status for Week {currentWeekNum} ({currentYear})
              </div>
              <div className="text-[11px] text-indigo-700">
                Target: 1 session of {formatMinutes(discipline.targetMinutes)} per week
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {weekStatus.completed ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Week Fulfilled ({formatMinutes(weekStatus.totalMinutes)})</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                Pending for Week {currentWeekNum}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 5 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Lifetime Hours
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {Math.round(totalMins / 60)}h {totalMins % 60}m
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            {activeLogsCount} sessions logged
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {isWeekly ? 'Avg Per Session' : 'Average Daily'}
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatMinutes(avgMins)}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            Target: {formatMinutes(discipline.targetMinutes)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Target Adherence
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {avgPct}%
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            Execution adherence
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {streaks.current} {isWeekly ? 'Weeks' : 'Days'}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            {isWeekly ? 'Consecutive weeks' : '>= 80% daily target'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            <span>Longest Streak</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {streaks.longest} {isWeekly ? 'Weeks' : 'Days'}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            Personal all-time record
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Time Invested */}
        <div className="p-5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                {isWeekly ? 'SESSION LOGS & DURATION' : 'DAILY TIME INVESTED'}
              </h3>
              <p className="text-xs text-neutral-500">
                Hours committed vs baseline benchmark ({formatMinutes(discipline.targetMinutes)})
              </p>
            </div>
            <div className="text-xs font-mono font-medium text-neutral-500">
              Benchmark: {+(discipline.targetMinutes / 60).toFixed(2)}h
            </div>
          </div>

          {chronological.length === 0 ? (
            <div className="h-60 w-full flex items-center justify-center border border-dashed border-neutral-200 rounded-lg text-xs text-neutral-400 font-mono">
              Awaiting logs for this discipline
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chronological.slice(-21)}
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
                            <div className="text-indigo-400 font-bold">
                              Delivered: {d.actualHours}h ({d.pct}%)
                            </div>
                            <div className="text-neutral-400">Target: {d.targetHours}h</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="actualHours"
                    fill={discipline.color}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Cumulative Growth */}
        <div className="p-5 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                CUMULATIVE LIFETIME COMPOUNDING
              </h3>
              <p className="text-xs text-neutral-500">
                Total hours accumulated into mastery curve
              </p>
            </div>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              {Math.round(totalMins / 60)}h total
            </div>
          </div>

          {chronological.length === 0 ? (
            <div className="h-60 w-full flex items-center justify-center border border-dashed border-neutral-200 rounded-lg text-xs text-neutral-400 font-mono">
              Awaiting logs for this discipline
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chronological}
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
                          <div className="bg-neutral-900 text-white p-2 rounded-lg text-xs font-mono">
                            <div className="text-neutral-400">{d.fullDate}</div>
                            <div className="text-emerald-400 font-bold">
                              Cumulative: {d.cumulativeHours} Hours
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeHours"
                    stroke={discipline.color}
                    fill={discipline.color}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Delete Discipline Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title={`Delete "${discipline.name}"?`}
        message={`Are you sure you want to permanently remove "${discipline.name}" from your active system?\n\nThis will remove it from your daily benchmark, logging sheets, and recalculate your overall adherence.`}
        confirmLabel="Delete Discipline"
        confirmVariant="danger"
        onConfirm={() => {
          if (onDeleteDiscipline) {
            onDeleteDiscipline(discipline.id);
          }
        }}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};

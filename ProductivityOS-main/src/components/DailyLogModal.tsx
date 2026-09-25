import React, { useState, useEffect } from 'react';
import { DailyRecord, UserSettings, ActivityDiscipline } from '../types';
import {
  formatMinutes,
  parseDurationInput,
  computeDailyRecord,
  getISOWeek,
  isWeeklyDisciplineCompleted,
} from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import { ConfirmModal } from './ConfirmModal';
import { Check, Sparkles, Plus, Calendar, Clock, Sun, AlertCircle, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DailyRecord) => void;
  onDelete?: (id: string) => void;
  onOpenAddDiscipline?: () => void;
  initialDate?: string;
  existingRecord?: DailyRecord;
  settings: UserSettings;
  allRecords?: DailyRecord[];
}

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenAddDiscipline,
  initialDate,
  existingRecord,
  settings,
  allRecords = [],
}) => {
  if (!isOpen) return null;

  const todayStr = initialDate || new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(existingRecord?.date || todayStr);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Map of discipline.id -> string duration input
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    settings.disciplines.forEach((d) => {
      const existingVal = existingRecord?.activityActuals?.[d.id];
      if (existingVal !== undefined && existingVal > 0) {
        init[d.id] = formatMinutes(existingVal, 'clock');
      } else if (existingRecord) {
        init[d.id] = '0:00';
      } else {
        // New log: daily default to target or 0, weekly default to 0
        init[d.id] = d.cadence === 'daily' ? formatMinutes(d.targetMinutes, 'clock') : '0:00';
      }
    });
    return init;
  });

  const [weeklyCompletedMap, setWeeklyCompletedMap] = useState<Record<string, boolean>>(() => {
    return existingRecord?.weeklyCompleted || {};
  });

  const [notes, setNotes] = useState<string>(existingRecord?.notes || '');

  // Keep inputs in sync if settings.disciplines changes
  useEffect(() => {
    setInputs((prev) => {
      const updated = { ...prev };
      settings.disciplines.forEach((d) => {
        if (updated[d.id] === undefined) {
          const existingVal = existingRecord?.activityActuals?.[d.id];
          updated[d.id] =
            existingVal !== undefined && existingVal > 0
              ? formatMinutes(existingVal, 'clock')
              : d.cadence === 'daily'
              ? formatMinutes(d.targetMinutes, 'clock')
              : '0:00';
        }
      });
      return updated;
    });
  }, [settings.disciplines, existingRecord]);

  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false);
  const dailyDisciplines = activeDisciplines.filter((d) => d.cadence === 'daily');
  const weeklyDisciplines = activeDisciplines.filter((d) => d.cadence === 'weekly');

  // Convert inputs to numeric actuals map
  const numericActuals: Record<string, number> = {};
  activeDisciplines.forEach((d) => {
    numericActuals[d.id] = parseDurationInput(inputs[d.id] || '0');
  });

  // Dynamic preview calculation
  const previewRecord = computeDailyRecord(
    date,
    numericActuals,
    settings,
    notes,
    weeklyCompletedMap
  );

  const { week: currentWeekNum, year: currentYear } = getISOWeek(date);

  const handleInputChange = (id: string, val: string) => {
    setInputs((prev) => ({ ...prev, [id]: val }));
  };

  const setDisciplineValue = (id: string, minutes: number) => {
    setInputs((prev) => ({ ...prev, [id]: formatMinutes(minutes, 'clock') }));
  };

  const handleFillAllTargets = () => {
    const filled: Record<string, string> = {};
    dailyDisciplines.forEach((d) => {
      filled[d.id] = formatMinutes(d.targetMinutes, 'clock');
    });
    weeklyDisciplines.forEach((d) => {
      filled[d.id] = inputs[d.id] || '0:00';
    });
    setInputs(filled);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(previewRecord);

    if (previewRecord.overallPct >= 100) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h2 className="font-semibold text-base text-neutral-900">
                Log Daily Performance
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enter time spent for each configured discipline. Recalculates all KPIs instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dailyDisciplines.length > 0 && (
              <button
                type="button"
                onClick={handleFillAllTargets}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Daily Targets</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Date Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200/80">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-0.5">
                Log Date
              </label>
              <div className="text-xs text-neutral-700 font-mono">
                {previewRecord.day} • Week {previewRecord.week}, {previewRecord.year}
              </div>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Empty state if user has no disciplines */}
          {activeDisciplines.length === 0 && (
            <div className="p-6 rounded-xl border border-dashed border-neutral-200 text-center space-y-3 bg-neutral-50/40">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  No Activity Disciplines Configured
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  You have not added any daily or weekly activity disciplines yet. Add your disciplines to log time.
                </p>
              </div>
              {onOpenAddDiscipline && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddDiscipline();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Activity Discipline</span>
                </button>
              )}
            </div>
          )}

          {/* 1. Daily Disciplines Section */}
          {dailyDisciplines.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Daily Disciplines</span>
                </div>
                <span>Target</span>
              </div>

              <div className="space-y-2">
                {dailyDisciplines.map((d) => {
                  const val = inputs[d.id] ?? '';
                  const numMins = parseDurationInput(val);
                  const isMet = d.targetMinutes > 0 && numMins >= d.targetMinutes;

                  return (
                    <div
                      key={d.id}
                      className="p-3 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: d.color }}
                        >
                          <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 truncate">
                            {d.name}
                          </div>
                          {d.tagline && (
                            <div className="text-[11px] text-neutral-400 truncate">
                              {d.tagline}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">
                          {formatMinutes(d.targetMinutes)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDisciplineValue(d.id, 0)}
                            className="min-w-[28px] px-2 py-1 text-[11px] font-mono rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer whitespace-nowrap leading-none"
                          >
                            0m
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisciplineValue(d.id, d.targetMinutes)}
                            className="min-w-[32px] px-2 py-1 text-[11px] font-mono rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer whitespace-nowrap leading-none"
                          >
                            Tgt
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="1:00"
                            value={val}
                            onChange={(e) => handleInputChange(d.id, e.target.value)}
                            className={`w-20 px-2 py-1.5 text-xs font-mono text-center border rounded-md focus:outline-hidden focus:ring-2 focus:ring-neutral-900 ${
                              isMet
                                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 font-bold'
                                : 'border-neutral-300 bg-white text-neutral-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Weekly Special Activities ("Once-a-Week") Section */}
          {weeklyDisciplines.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Weekly Special Disciplines (Once a Week)</span>
                </div>
                <span>Session Target</span>
              </div>

              <div className="space-y-2">
                {weeklyDisciplines.map((d) => {
                  const val = inputs[d.id] ?? '0:00';
                  const numMins = parseDurationInput(val);
                  const isLoggedToday = numMins > 0;

                  // Check if already completed in current week across all records
                  const weekStatus = isWeeklyDisciplineCompleted(
                    allRecords,
                    d.id,
                    currentWeekNum,
                    currentYear
                  );

                  return (
                    <div
                      key={d.id}
                      className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/40 hover:border-neutral-300 transition-colors space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: d.color }}
                          >
                            <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-neutral-900">
                                {d.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 leading-none whitespace-nowrap">
                                1x / Week
                              </span>
                            </div>
                            {d.tagline && (
                              <div className="text-[11px] text-neutral-400">
                                {d.tagline}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md whitespace-nowrap">
                            {formatMinutes(d.targetMinutes)}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (numMins === 0) {
                                setDisciplineValue(d.id, d.targetMinutes);
                                setWeeklyCompletedMap((prev) => ({ ...prev, [d.id]: true }));
                              } else {
                                setDisciplineValue(d.id, 0);
                                setWeeklyCompletedMap((prev) => ({ ...prev, [d.id]: false }));
                              }
                            }}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                              isLoggedToday
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                            }`}
                          >
                            {isLoggedToday ? '✓ Done Today' : '+ Log Session Today'}
                          </button>

                          <input
                            type="text"
                            placeholder="0:00"
                            value={val}
                            onChange={(e) => handleInputChange(d.id, e.target.value)}
                            className="w-20 px-2 py-1.5 text-xs font-mono text-center border border-neutral-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                      </div>

                      {/* Weekly Status Indicator */}
                      <div className="pt-1.5 border-t border-neutral-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-neutral-500">
                        <span>
                          Week {currentWeekNum} Status:
                        </span>
                        <span>
                          {weekStatus.completed || isLoggedToday ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Fulfilled for Week {currentWeekNum} ({formatMinutes(weekStatus.totalMinutes + (existingRecord ? 0 : numMins))})</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">
                              Pending this week (0/1 sessions)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Reflection / Daily Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="E.g. Shipped authentication PR, completed 5km interval workout."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Live Dynamic Score Bar */}
          <div className="p-3.5 rounded-lg bg-neutral-900 text-white flex items-center justify-between">
            <div>
              <div className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider">
                Automated Score Preview
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono">
                  {previewRecord.overallPct}%
                </span>
                <span className="text-xs text-neutral-300 font-mono">
                  ({formatMinutes(previewRecord.totalActual)} / {formatMinutes(previewRecord.totalTarget || 60)})
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                  previewRecord.status === 'COMPLETED'
                    ? 'bg-emerald-500 text-white'
                    : previewRecord.status === 'GOOD'
                    ? 'bg-blue-500 text-white'
                    : previewRecord.status === 'PARTIAL'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {previewRecord.status}
              </span>
              <span className="text-[10px] text-neutral-400 mt-1">
                {previewRecord.overallPct >= 80 ? '✓ Counts for Streak' : 'Below 80% streak standard'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {onOpenAddDiscipline && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddDiscipline();
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add More Disciplines</span>
                </button>
              )}

              {existingRecord && onDelete && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Delete this daily log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Entry</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-black text-white rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Commit Daily Log</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Entry Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Daily Entry?"
        message={`Are you sure you want to delete the daily log for ${date}?\n\nThis will remove all logged actuals for this date from your analytics and streak calculations.`}
        confirmLabel="Delete Entry"
        confirmVariant="danger"
        onConfirm={() => {
          if (existingRecord && onDelete) {
            onDelete(existingRecord.id);
            setIsDeleteConfirmOpen(false);
            onClose();
          }
        }}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};

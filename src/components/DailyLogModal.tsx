import React, { useState, useEffect, useMemo } from 'react';
import { DailyRecord, UserSettings, ActivityDiscipline } from '../types';
import {
  formatMinutes,
  parseDurationInput,
  validateDurationInput,
  isValidISODateString,
  computeDailyRecord,
  getISOWeek,
  isWeeklyDisciplineCompleted,
} from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import { ConfirmModal } from './ConfirmModal';
import {
  Check,
  Sparkles,
  Plus,
  Calendar,
  Clock,
  Sun,
  AlertCircle,
  Trash2,
  Edit2,
  Archive,
  AlertTriangle,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DailyRecord, previousDate?: string) => void;
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

  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getYesterdayISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const defaultDate = initialDate || getTodayISO();
  const initialTargetDate = existingRecord?.date || defaultDate;

  // Track original date to safely support editing/moving records
  const [originalDate, setOriginalDate] = useState<string>(initialTargetDate);
  const [date, setDate] = useState<string>(initialTargetDate);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active record currently being edited for the selected date
  const activeRecord = useMemo(() => {
    if (existingRecord && existingRecord.date === date) {
      return existingRecord;
    }
    return allRecords.find((r) => r.date === date);
  }, [date, existingRecord, allRecords]);

  const isEditingExisting = !!activeRecord;

  // Map of discipline.id -> string duration input
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    const base = existingRecord || allRecords.find((r) => r.date === initialTargetDate);

    settings.disciplines.forEach((d) => {
      const existingVal = base?.activityActuals?.[d.id];
      if (existingVal !== undefined && existingVal > 0) {
        init[d.id] = formatMinutes(existingVal, 'clock');
      } else if (base) {
        init[d.id] = '0:00';
      } else {
        // New log: daily default to target or 0, weekly default to 0
        init[d.id] =
          d.cadence === 'daily' && !d.isArchived && d.isActive !== false
            ? formatMinutes(d.targetMinutes, 'clock')
            : '0:00';
      }
    });
    return init;
  });

  const [weeklyCompletedMap, setWeeklyCompletedMap] = useState<Record<string, boolean>>(() => {
    const base = existingRecord || allRecords.find((r) => r.date === initialTargetDate);
    return base?.weeklyCompleted || {};
  });

  const [notes, setNotes] = useState<string>(() => {
    const base = existingRecord || allRecords.find((r) => r.date === initialTargetDate);
    return base?.notes || '';
  });

  // When modal opens or initial date/record props change, synchronize form state
  useEffect(() => {
    const target = existingRecord?.date || initialDate || getTodayISO();
    setOriginalDate(target);
    setDate(target);

    const base = existingRecord || allRecords.find((r) => r.date === target);
    const newInputs: Record<string, string> = {};

    settings.disciplines.forEach((d) => {
      const existingVal = base?.activityActuals?.[d.id];
      if (existingVal !== undefined && existingVal > 0) {
        newInputs[d.id] = formatMinutes(existingVal, 'clock');
      } else if (base) {
        newInputs[d.id] = '0:00';
      } else {
        newInputs[d.id] =
          d.cadence === 'daily' && !d.isArchived && d.isActive !== false
            ? formatMinutes(d.targetMinutes, 'clock')
            : '0:00';
      }
    });

    setInputs(newInputs);
    setWeeklyCompletedMap(base?.weeklyCompleted || {});
    setNotes(base?.notes || '');
  }, [isOpen, initialDate, existingRecord]);

  // When user changes the date picker:
  const handleDateChange = (newDateStr: string) => {
    setDate(newDateStr);
    const matched = allRecords.find((r) => r.date === newDateStr);

    if (matched) {
      // Load existing historical record data
      const matchedInputs: Record<string, string> = {};
      settings.disciplines.forEach((d) => {
        const val = matched.activityActuals?.[d.id];
        matchedInputs[d.id] = val !== undefined && val > 0 ? formatMinutes(val, 'clock') : '0:00';
      });
      setInputs(matchedInputs);
      setWeeklyCompletedMap(matched.weeklyCompleted || {});
      setNotes(matched.notes || '');
    } else {
      // Initialize clean inputs for a new record on this date
      const freshInputs: Record<string, string> = {};
      settings.disciplines.forEach((d) => {
        if (!d.isArchived && d.isActive !== false) {
          freshInputs[d.id] = d.cadence === 'daily' ? formatMinutes(d.targetMinutes, 'clock') : '0:00';
        } else {
          freshInputs[d.id] = '0:00';
        }
      });
      setInputs(freshInputs);
      setWeeklyCompletedMap({});
      setNotes('');
    }
  };

  // Visible disciplines:
  const visibleDisciplines = useMemo(() => {
    return settings.disciplines.filter((d) => {
      if (d.isActive !== false && !d.isArchived) return true;
      const loggedMins = activeRecord?.activityActuals?.[d.id] || 0;
      const currentInputMins = parseDurationInput(inputs[d.id] || '0');
      return loggedMins > 0 || currentInputMins > 0;
    });
  }, [settings.disciplines, activeRecord, inputs]);

  const dailyDisciplines = visibleDisciplines.filter((d) => d.cadence === 'daily');
  const weeklyDisciplines = visibleDisciplines.filter((d) => d.cadence === 'weekly');

  // Input validation
  const dateValidation = useMemo(() => {
    if (!isValidISODateString(date)) {
      return 'Please enter a valid calendar date in YYYY-MM-DD format.';
    }
    return null;
  }, [date]);

  const durationValidation = useMemo(() => {
    const errors: Record<string, string> = {};
    visibleDisciplines.forEach((d) => {
      const rawVal = inputs[d.id];
      if (rawVal !== undefined && rawVal.trim() !== '') {
        const res = validateDurationInput(rawVal);
        if (!res.isValid) {
          errors[d.id] = res.error || 'Invalid duration.';
        }
      }
    });
    return errors;
  }, [inputs, visibleDisciplines]);

  const hasValidationErrors = !!dateValidation || Object.keys(durationValidation).length > 0;

  // Convert inputs to numeric actuals map
  const numericActuals: Record<string, number> = {};
  visibleDisciplines.forEach((d) => {
    numericActuals[d.id] = parseDurationInput(inputs[d.id] || '0');
  });

  // Preserve any historical actuals that might not be in visibleDisciplines
  if (activeRecord?.activityActuals) {
    Object.keys(activeRecord.activityActuals).forEach((actId) => {
      if (numericActuals[actId] === undefined) {
        numericActuals[actId] = activeRecord.activityActuals[actId];
      }
    });
  }

  // Dynamic preview calculation
  const previewRecord = computeDailyRecord(
    date,
    numericActuals,
    settings,
    notes,
    weeklyCompletedMap,
    {
      id: activeRecord?.id || date,
      createdAt: activeRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
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
      if (!d.isArchived) {
        filled[d.id] = formatMinutes(d.targetMinutes, 'clock');
      } else {
        filled[d.id] = inputs[d.id] || '0:00';
      }
    });
    weeklyDisciplines.forEach((d) => {
      filled[d.id] = inputs[d.id] || '0:00';
    });
    setInputs((prev) => ({ ...prev, ...filled }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValidationErrors || isSubmitting) return;

    setIsSubmitting(true);
    try {
      onSave(previewRecord, originalDate);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEditingExisting ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
              />
              <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                {isEditingExisting ? (
                  <>
                    <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Edit Daily Record</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Log Daily Performance</span>
                  </>
                )}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isEditingExisting
                ? `Updating existing record for ${date}. Recalculates stats instantly.`
                : 'Enter time spent for each configured discipline. Recalculates all KPIs instantly.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dailyDisciplines.length > 0 && (
              <button
                type="button"
                onClick={handleFillAllTargets}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Targets</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Record Status Banner */}
          <div
            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border ${
              isEditingExisting
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                : 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isEditingExisting ? (
                <Edit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              )}
              <span className="font-medium">
                {isEditingExisting
                  ? `Editing existing record for ${date}`
                  : `Creating new record for ${date}`}
              </span>
            </div>
            {activeRecord?.createdAt && (
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                Created: {activeRecord.createdAt.slice(0, 10)}
              </span>
            )}
          </div>

          {/* Date Selector with Quick Date Buttons */}
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
                  Record Date
                </label>
                <div className="text-xs text-neutral-700 dark:text-neutral-300 font-mono">
                  {previewRecord.day} • Week {previewRecord.week}, {previewRecord.year}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDateChange(getTodayISO())}
                  className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    date === getTodayISO()
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDateChange(getYesterdayISO())}
                  className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    date === getYesterdayISO()
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  Yesterday
                </button>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  className={`px-3 py-1.5 text-xs font-mono border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 ${
                    dateValidation
                      ? 'border-rose-400 text-rose-900 focus:ring-rose-500'
                      : 'border-neutral-300 dark:border-neutral-700 focus:ring-neutral-900 dark:focus:ring-neutral-100'
                  }`}
                />
              </div>
            </div>
            {dateValidation && (
              <p className="text-[11px] text-rose-600 font-medium px-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{dateValidation}</span>
              </p>
            )}
          </div>

          {/* Daily Disciplines Section */}
          {dailyDisciplines.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
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
                  const fieldError = durationValidation[d.id];

                  return (
                    <div
                      key={d.id}
                      className={`p-3 rounded-xl border transition-colors flex flex-col space-y-1.5 ${
                        fieldError
                          ? 'border-rose-300 bg-rose-50/20'
                          : d.isArchived
                          ? 'border-amber-200/80 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: d.color }}
                          >
                            <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {d.name}
                              </span>
                              {d.isArchived && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 flex items-center gap-1">
                                  <Archive className="w-2.5 h-2.5" />
                                  <span>Archived</span>
                                </span>
                              )}
                            </div>
                            {d.tagline && (
                              <div className="text-[11px] text-neutral-400 truncate">
                                {d.tagline}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                            {formatMinutes(d.targetMinutes)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDisciplineValue(d.id, 0)}
                              className="px-2 py-1 text-[11px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer leading-none"
                            >
                              0m
                            </button>
                            <button
                              type="button"
                              onClick={() => setDisciplineValue(d.id, d.targetMinutes)}
                              className="px-2 py-1 text-[11px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer leading-none"
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
                              className={`w-20 px-2 py-1.5 text-xs font-mono text-center border rounded-lg focus:outline-hidden focus:ring-2 ${
                                fieldError
                                  ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                                  : isMet
                                  ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold'
                                  : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-neutral-900 dark:focus:ring-neutral-100'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {fieldError && (
                        <p className="text-[10px] text-rose-600 font-mono text-right">
                          {fieldError}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Special Activities ("Once-a-Week") Section */}
          {weeklyDisciplines.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
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
                  const fieldError = durationValidation[d.id];

                  const weekStatus = isWeeklyDisciplineCompleted(
                    allRecords,
                    d.id,
                    currentWeekNum,
                    currentYear
                  );

                  return (
                    <div
                      key={d.id}
                      className={`p-3 rounded-xl border transition-colors space-y-2 ${
                        fieldError
                          ? 'border-rose-300 bg-rose-50/20'
                          : d.isArchived
                          ? 'border-amber-200/80 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/30 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: d.color }}
                          >
                            <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                {d.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 leading-none whitespace-nowrap">
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
                          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md whitespace-nowrap">
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
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {isLoggedToday ? '✓ Done Today' : '+ Log Session Today'}
                          </button>

                          <input
                            type="text"
                            placeholder="0:00"
                            value={val}
                            onChange={(e) => handleInputChange(d.id, e.target.value)}
                            className={`w-20 px-2 py-1.5 text-xs font-mono text-center border rounded-lg focus:outline-hidden focus:ring-2 ${
                              fieldError
                                ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-neutral-900 dark:focus:ring-neutral-100'
                            }`}
                          />
                        </div>
                      </div>

                      {fieldError && (
                        <p className="text-[10px] text-rose-600 font-mono text-right">
                          {fieldError}
                        </p>
                      )}

                      {/* Weekly Status Indicator */}
                      <div className="pt-1.5 border-t border-neutral-200/50 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                        <span>Week {currentWeekNum} Status:</span>
                        <span>
                          {weekStatus.completed || isLoggedToday ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Fulfilled for Week {currentWeekNum} ({formatMinutes(weekStatus.totalMinutes + (activeRecord ? 0 : numMins))})</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">Pending this week (0/1 sessions)</span>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              Reflection / Daily Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="E.g. Shipped authentication PR, completed 5km interval workout."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>

          {/* Live Dynamic Score Bar */}
          <div className="p-4 rounded-xl bg-neutral-900 dark:bg-black text-white flex items-center justify-between border border-neutral-800">
            <div>
              <div className="text-[11px] text-neutral-400 font-mono uppercase tracking-wider">
                Automated Score Preview
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono">
                  {previewRecord.overallPct}%
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  ({formatMinutes(previewRecord.totalActual)} / {formatMinutes(previewRecord.totalTarget || 255)})
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
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add More Disciplines</span>
                </button>
              )}

              {activeRecord && onDelete && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
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
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={hasValidationErrors || isSubmitting}
                className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors ${
                  hasValidationErrors || isSubmitting
                    ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 cursor-pointer'
                }`}
                title={hasValidationErrors ? 'Please correct validation errors before saving' : undefined}
              >
                <Check className="w-4 h-4" />
                <span>{isEditingExisting ? 'Save Changes' : 'Commit Daily Log'}</span>
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
          if (activeRecord && onDelete) {
            onDelete(activeRecord.id);
            setIsDeleteConfirmOpen(false);
            onClose();
          }
        }}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};

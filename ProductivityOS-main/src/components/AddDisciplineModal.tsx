import React, { useState } from 'react';
import { ActivityDiscipline, ActivityCadence } from '../types';
import { POPULAR_DISCIPLINE_PRESETS, formatMinutes, parseDurationInput, validateDurationInput } from '../data/productivityStore';
import { DisciplineIcon, AVAILABLE_ICONS } from './DisciplineIcon';
import { ConfirmModal } from './ConfirmModal';
import { X, Check, Calendar, Sun, Clock, Sparkles, Trash2, Archive, RotateCcw } from 'lucide-react';

interface AddDisciplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (discipline: ActivityDiscipline) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string, archive: boolean) => void;
  initialDiscipline?: ActivityDiscipline | null;
  existingDiscipline?: ActivityDiscipline | null;
}

const COLOR_PALETTE = [
  { hex: '#4F46E5', name: 'Indigo' },
  { hex: '#2563EB', name: 'Blue' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#D97706', name: 'Amber' },
  { hex: '#7C3AED', name: 'Violet' },
  { hex: '#E11D48', name: 'Rose' },
  { hex: '#0891B2', name: 'Cyan' },
  { hex: '#475569', name: 'Slate' },
];

export const AddDisciplineModal: React.FC<AddDisciplineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onArchive,
  initialDiscipline,
  existingDiscipline,
}) => {
  if (!isOpen) return null;

  const currentDisc = initialDiscipline || existingDiscipline;
  const isEditing = !!currentDisc;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [name, setName] = useState(currentDisc?.name || '');
  const [tagline, setTagline] = useState(currentDisc?.tagline || '');
  const [category, setCategory] = useState(currentDisc?.category || 'Technical');
  const [cadence, setCadence] = useState<ActivityCadence>(currentDisc?.cadence || 'daily');
  const [durationStr, setDurationStr] = useState<string>(
    currentDisc ? formatMinutes(currentDisc.targetMinutes, 'clock') : '1:00'
  );
  const [color, setColor] = useState(currentDisc?.color || '#4F46E5');
  const [icon, setIcon] = useState(currentDisc?.icon || 'code');
  const [error, setError] = useState<string>('');

  const targetMinutes = parseDurationInput(durationStr);

  const applyPreset = (preset: typeof POPULAR_DISCIPLINE_PRESETS[0]) => {
    setName(preset.name);
    setTagline(preset.tagline || '');
    setCategory(preset.category);
    setCadence(preset.cadence);
    setDurationStr(formatMinutes(preset.targetMinutes, 'clock'));
    setColor(preset.color);
    setIcon(preset.icon);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an activity discipline name.');
      return;
    }
    const valResult = validateDurationInput(durationStr);
    if (!valResult.isValid) {
      setError(valResult.error || 'Please enter a valid target duration.');
      return;
    }
    if (valResult.minutes <= 0) {
      setError('Target duration must be at least 1 minute.');
      return;
    }
    if (valResult.minutes > 1440) {
      setError('Target duration cannot exceed 24 hours (1440 minutes).');
      return;
    }

    // Preserve the stable ID when editing an existing discipline so historical records stay intact!
    const id =
      currentDisc?.id ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') +
        '_' +
        Date.now().toString(36).slice(-4);

    const newDiscipline: ActivityDiscipline = {
      id,
      name: name.trim(),
      tagline: tagline.trim(),
      category: category.trim() || 'General',
      cadence,
      targetMinutes: valResult.minutes,
      weeklyTargetCount: cadence === 'weekly' ? 1 : undefined,
      color,
      icon,
      isActive: currentDisc?.isActive !== false,
      isArchived: currentDisc?.isArchived,
      archivedAt: currentDisc?.archivedAt,
      createdAt: currentDisc?.createdAt || new Date().toISOString(),
    };

    onSave(newDiscipline);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <DisciplineIcon name={icon} className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                {isEditing ? 'Edit Activity Discipline' : 'Add Activity Discipline'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure your custom discipline with daily or weekly special cadence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets (Only in Add mode) */}
        {!isEditing && (
          <div className="px-6 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/20">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Quick Presets (Click to Auto-fill)</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {POPULAR_DISCIPLINE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-full text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}</span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    ({p.cadence === 'weekly' ? 'Weekly' : 'Daily'} {formatMinutes(p.targetMinutes)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* 1. Cadence Selector (Daily vs Weekly Once) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              Cadence & Frequency
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCadence('daily')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  cadence === 'daily'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className={`w-4 h-4 ${cadence === 'daily' ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Daily Discipline</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                  Targeted every single day. Daily streaks and progress tracked each day.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCadence('weekly')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  cadence === 'weekly'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${cadence === 'weekly' ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Weekly Special Activity</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                  Special activity once a week (e.g., Weekly Retrospective, Deep Clean, Long Run).
                </p>
              </button>
            </div>
          </div>

          {/* 2. Discipline Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Discipline Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Coding, Workout"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Technical, Fitness, Creative"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 3. Description / Tagline */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
              Short Description / Purpose
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. 1 hour of focused coding & algorithms"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 4. Target Duration & Quick Duration Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {cadence === 'daily' ? 'Daily Target Duration' : 'Weekly Session Target Duration'}
              </label>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {formatMinutes(targetMinutes)} ({targetMinutes} min)
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={durationStr}
                  onChange={(e) => setDurationStr(e.target.value)}
                  placeholder="e.g. 1:00 or 60"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Clock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-neutral-400 mr-1">Quick Select:</span>
                {[30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationStr(formatMinutes(mins, 'clock'))}
                    className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 cursor-pointer whitespace-nowrap"
                  >
                    {formatMinutes(mins)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Color and Icon Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Color Palette */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
                Color Tag
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                      color === c.hex ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
                Icon Symbol
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setIcon(ic.id)}
                    title={ic.label}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      icon === ic.id
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <DisciplineIcon name={ic.id} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {isEditing && onArchive && currentDisc && (
                <button
                  type="button"
                  onClick={() => {
                    onArchive(currentDisc.id, !currentDisc.isArchived);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  title={currentDisc.isArchived ? "Restore to active roster" : "Archive without deleting past historical records"}
                >
                  {currentDisc.isArchived ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Unarchive</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Archive (Safe)</span>
                    </>
                  )}
                </button>
              )}

              {isEditing && onDelete && currentDisc && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="px-3 py-2 rounded-lg text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Permanently remove discipline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Create Activity Discipline'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Discipline Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title={`Delete "${currentDisc?.name}"?`}
        message={`Are you sure you want to permanently delete "${currentDisc?.name}"?\n\nTip: If you simply want to retire this habit from your daily targets while keeping all historical logs intact in your database and charts, choose "Archive (Safe)" instead.`}
        confirmLabel="Delete Discipline"
        confirmVariant="danger"
        onConfirm={() => {
          if (currentDisc && onDelete) {
            onDelete(currentDisc.id);
            setIsDeleteConfirmOpen(false);
            onClose();
          }
        }}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};

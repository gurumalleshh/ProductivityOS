import React, { useState } from 'react';
import { UserSettings, ActivityDiscipline, DailyRecord } from '../types';
import { formatMinutes, POPULAR_DISCIPLINE_PRESETS } from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  Save,
  RotateCcw,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Copy,
  Trash2,
  AlertTriangle,
  Plus,
  Edit2,
  Calendar,
  Sun,
  Sparkles,
  Archive,
  Upload,
  RefreshCw,
  FolderArchive,
  FileCheck,
} from 'lucide-react';
import { generateGoogleSheetsAutomationScript } from '../services/sheetsExportService';
import { ConfirmModal } from './ConfirmModal';
import { RestoreModal } from './RestoreModal';
import {
  validateBackupJSON,
  ProductivityBackupData,
} from '../services/backupRestoreService';

interface SettingsViewProps {
  settings: UserSettings;
  records?: DailyRecord[];
  onUpdateSettings: (newSettings: UserSettings) => void;
  onOpenAddDiscipline?: () => void;
  onEditDiscipline?: (discipline: ActivityDiscipline) => void;
  onDeleteDiscipline?: (id: string) => void;
  onArchiveDiscipline?: (id: string) => void;
  onExportBackup?: () => void;
  onRestoreBackup?: (backupData: ProductivityBackupData, strategy: 'replace' | 'merge') => void;
  onClearAllRecords?: () => void;
  recordsCount?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  records = [],
  onUpdateSettings,
  onOpenAddDiscipline,
  onEditDiscipline,
  onDeleteDiscipline,
  onArchiveDiscipline,
  onExportBackup,
  onRestoreBackup,
  onClearAllRecords,
  recordsCount = 0,
}) => {
  const [savedAlert, setSavedAlert] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [clearedAlert, setClearedAlert] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState<ActivityDiscipline | null>(null);
  const [disciplineToArchive, setDisciplineToArchive] = useState<ActivityDiscipline | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Backup & Restore states
  const [pendingRestore, setPendingRestore] = useState<ProductivityBackupData | null>(null);
  const [restoreErrors, setRestoreErrors] = useState<string[] | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Distinguish active from archived
  const activeDisciplines = settings.disciplines.filter((d) => !d.isArchived);
  const archivedDisciplines = settings.disciplines.filter((d) => d.isArchived);

  const dailyDisciplines = activeDisciplines.filter((d) => d.cadence === 'daily' && d.isActive !== false);
  const weeklyDisciplines = activeDisciplines.filter((d) => d.cadence === 'weekly' && d.isActive !== false);

  const dailyBenchmarkMinutes = dailyDisciplines.reduce((acc, d) => acc + d.targetMinutes, 0);

  const handleUpdateDuration = (disciplineId: string, newMins: number) => {
    const updated = settings.disciplines.map((d) =>
      d.id === disciplineId ? { ...d, targetMinutes: Math.max(1, newMins) } : d
    );
    onUpdateSettings({ ...settings, disciplines: updated });
  };

  const handleAddPreset = (preset: typeof POPULAR_DISCIPLINE_PRESETS[0]) => {
    const id =
      preset.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_') +
      '_' +
      Date.now().toString(36).slice(-4);

    const newDisc: ActivityDiscipline = {
      id,
      name: preset.name,
      tagline: preset.tagline || '',
      category: preset.category,
      cadence: preset.cadence,
      targetMinutes: preset.targetMinutes,
      weeklyTargetCount: preset.cadence === 'weekly' ? 1 : undefined,
      color: preset.color,
      icon: preset.icon,
      isActive: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    onUpdateSettings({
      ...settings,
      disciplines: [...settings.disciplines, newDisc],
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleArchive = (disciplineId: string) => {
    if (onArchiveDiscipline) {
      onArchiveDiscipline(disciplineId);
    } else {
      const updated = settings.disciplines.map((d) =>
        d.id === disciplineId
          ? { ...d, isArchived: true, isActive: false, archivedAt: new Date().toISOString() }
          : d
      );
      onUpdateSettings({ ...settings, disciplines: updated });
    }
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleUnarchive = (disciplineId: string) => {
    const updated = settings.disciplines.map((d) =>
      d.id === disciplineId
        ? { ...d, isArchived: false, isActive: true, archivedAt: undefined }
        : d
    );
    onUpdateSettings({ ...settings, disciplines: updated });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleCopyScript = () => {
    const script = generateGoogleSheetsAutomationScript(settings);
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateBackupJSON(text);
        if (!validation.isValid || !validation.backupData) {
          setRestoreErrors(validation.errors);
          setPendingRestore(null);
        } else {
          setRestoreErrors(null);
          setPendingRestore(validation.backupData);
        }
      } catch (err: any) {
        setRestoreErrors([`File read error: ${err.message}`]);
        setPendingRestore(null);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                SYSTEM SETTINGS & DATA SAFETY
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                Sheet 12
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Configure daily benchmark disciplines, export/restore full offline JSON backups, and manage archive states safely.
            </p>
          </div>

          {onOpenAddDiscipline && (
            <button
              type="button"
              onClick={onOpenAddDiscipline}
              className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Activity Discipline</span>
            </button>
          )}
        </div>
      </div>

      {savedAlert && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Discipline configuration updated successfully!</span>
        </div>
      )}

      {/* DATA SAFETY, BACKUP & RESTORE CARD */}
      <div className="p-6 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                DATA SAFETY & COMPLETE JSON BACKUP
              </h3>
              <p className="text-xs text-neutral-500">
                Local-first zero cloud dependency. Backup, validate, and restore your full workspace anytime.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>
            )}
            <label className="px-3.5 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-neutral-600" />
              <span>Restore from JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelected}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="font-semibold text-neutral-800">Stored Historical Records</div>
            <div className="text-lg font-bold font-mono text-neutral-900 mt-0.5">{recordsCount}</div>
            <div className="text-[11px] text-neutral-500 mt-1">Full daily logs in local persistence.</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="font-semibold text-neutral-800">Activity Disciplines</div>
            <div className="text-lg font-bold font-mono text-neutral-900 mt-0.5">
              {activeDisciplines.length}{' '}
              <span className="text-xs font-normal text-neutral-400">
                ({archivedDisciplines.length} archived)
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Custom goals and benchmark structure.</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="font-semibold text-neutral-800">Pre-Restore Safety Snapshot</div>
            <div className="text-xs font-mono text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" /> Automatic Snapshot Active
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Guarantees zero data loss by creating an instant snapshot prior to any restore.
            </div>
          </div>
        </div>

        {restoreErrors && restoreErrors.length > 0 && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Cannot Restore File — Validation Failed:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-1">
              {restoreErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {restoreSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{restoreSuccess}</span>
          </div>
        )}
      </div>

      {/* DISCIPLINE MANAGEMENT CARD */}
      <div className="p-6 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              ACTIVE ACTIVITY DISCIPLINES ({activeDisciplines.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Disciplines currently contributing to your daily standard benchmark.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500">
              Daily Benchmark:{' '}
              <strong className="text-neutral-900 font-bold">
                {formatMinutes(dailyBenchmarkMinutes)} / day
              </strong>
            </span>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Quick-Add Popular Activity Presets</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {POPULAR_DISCIPLINE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(p)}
                className="px-2.5 py-1 rounded-md text-xs bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3 text-neutral-400" />
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

        {/* Active Disciplines List */}
        {activeDisciplines.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-dashed border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-800">
              No Active Disciplines
            </h4>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Add custom disciplines or unarchive previous ones to calculate daily targets.
            </p>
            {onOpenAddDiscipline && (
              <button
                type="button"
                onClick={onOpenAddDiscipline}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Your First Activity Discipline</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeDisciplines.map((d) => (
              <div
                key={d.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  d.isActive !== false
                    ? 'border-neutral-200 bg-white'
                    : 'border-neutral-200/60 bg-neutral-50/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-2xs shrink-0"
                    style={{ backgroundColor: d.color }}
                  >
                    <DisciplineIcon name={d.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">
                        {d.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold whitespace-nowrap leading-none ${
                          d.cadence === 'weekly'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {d.cadence === 'weekly' ? '📅 Weekly (1x)' : '☀️ Daily'}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {d.category}
                      </span>
                    </div>
                    {d.tagline && (
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {d.tagline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Target duration input */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400 font-mono">Target:</span>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={d.targetMinutes}
                      onChange={(e) => handleUpdateDuration(d.id, Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs font-mono text-center border border-neutral-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                    />
                    <span className="text-xs font-mono text-neutral-600 min-w-[60px] text-left">
                      {formatMinutes(d.targetMinutes)}
                    </span>
                  </div>

                  {/* Actions: Edit, Archive (Safe), Delete */}
                  <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
                    {onEditDiscipline && (
                      <button
                        type="button"
                        onClick={() => onEditDiscipline(d)}
                        className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                        title="Edit Discipline"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDisciplineToArchive(d)}
                      className="p-1.5 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                      title="Archive Discipline (Safe — preserves historical logs)"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    {onDeleteDiscipline && (
                      <button
                        type="button"
                        onClick={() => setDisciplineToDelete(d)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remove Discipline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calculated Benchmark Summary Box */}
        <div className="p-4 rounded-xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold font-mono text-neutral-200">
              TOTAL DAILY TARGET BENCHMARK
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Sum of active daily disciplines (formula: =SUM(DAILY_TARGETS))
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatMinutes(dailyBenchmarkMinutes)} / day
          </div>
        </div>
      </div>

      {/* ARCHIVED DISCIPLINES ACCORDION / SECTION */}
      {archivedDisciplines.length > 0 && (
        <div className="p-6 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-neutral-900">
                ARCHIVED DISCIPLINES ({archivedDisciplines.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </button>
          </div>

          <p className="text-xs text-neutral-500">
            Archived disciplines are hidden from your daily logging roster and do not count toward your daily benchmark, but all historical time and streaks remain 100% intact.
          </p>

          {showArchived && (
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              {archivedDisciplines.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: d.color }}
                    >
                      <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-800 line-through decoration-neutral-400">
                          {d.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-medium">
                          Archived
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {d.category} &bull; Target was {formatMinutes(d.targetMinutes)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnarchive(d.id)}
                    className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-neutral-500" />
                    <span>Unarchive / Restore</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WEEKLY CADENCE SPECIFICATION CARD */}
      <div className="p-6 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-neutral-900">
            HOW WEEKLY SPECIAL ACTIVITIES WORK
          </h3>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Weekly disciplines are designed for special, high-impact activities that occur once a week rather than every single day (for example: <em>Weekly System Retrospective, Long Endurance Run, Financial Audit, Deep Cleaning</em>).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="font-semibold text-neutral-800">ISO Week Alignment</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Sessions logged on any day of the week fulfill the weekly target for that ISO calendar week.
            </div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="font-semibold text-neutral-800">Independent Streaks</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Streak tracking measures <strong>consecutive unbroken weeks</strong> rather than daily streaks.
            </div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="font-semibold text-neutral-800">Daily Total Protection</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Does not artificially inflate your daily 80% completion requirement on off-days.
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Export Script */}
      <div className="p-6 rounded-xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-neutral-900">
              GOOGLE APPS SCRIPT AUTOMATION SPEC
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyScript}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            {copiedScript ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Ready-to-paste Google Apps Script code to bootstrap your 13-sheet workbook inside Google Sheets with all formulas and conditional formatting pre-configured.
        </p>
      </div>

      {/* DANGER ZONE: DATA MANAGEMENT */}
      <div className="p-6 rounded-xl bg-white border border-rose-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-semibold text-rose-900">
            DATABASE MANAGEMENT & RESET
          </h3>
        </div>
        <p className="text-xs text-neutral-500">
          Currently tracking <strong>{recordsCount}</strong> daily record(s) and{' '}
          <strong>{settings.disciplines.length}</strong> total discipline(s).
        </p>

        {clearedAlert && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>All records cleared. Fresh database initialized.</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          {onClearAllRecords && (
            <button
              type="button"
              onClick={() => setIsClearAllConfirmOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Erase All Daily Records</span>
            </button>
          )}
        </div>
      </div>

      {/* Safe Archive Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!disciplineToArchive}
        title={`Archive "${disciplineToArchive?.name}"?`}
        message={`Archiving "${disciplineToArchive?.name}" will safely remove it from your daily logging roster and daily standard benchmark without losing any historical data.\n\nAll past minutes and streaks logged for this activity remain preserved and you can unarchive it at any time.`}
        confirmLabel="Archive (Safe)"
        confirmVariant="primary"
        onConfirm={() => {
          if (disciplineToArchive) {
            handleArchive(disciplineToArchive.id);
            setDisciplineToArchive(null);
          }
        }}
        onClose={() => setDisciplineToArchive(null)}
      />

      {/* Delete Discipline Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!disciplineToDelete}
        title={`Remove "${disciplineToDelete?.name}"?`}
        message={`Are you sure you want to remove "${disciplineToDelete?.name}" from your disciplines list?\n\nRecommendation: Archive instead to keep your settings list clean without removing configuration.\n\nNote: In ProductivityOS, historical logged minutes are always preserved.`}
        confirmLabel="Remove from Roster"
        confirmVariant="danger"
        onConfirm={() => {
          if (disciplineToDelete && onDeleteDiscipline) {
            onDeleteDiscipline(disciplineToDelete.id);
            setDisciplineToDelete(null);
          }
        }}
        onClose={() => setDisciplineToDelete(null)}
      />

      {/* Erase All Records Confirmation Dialog */}
      <ConfirmModal
        isOpen={isClearAllConfirmOpen}
        title="Erase All Daily Records?"
        message={`Are you sure you want to erase all ${recordsCount} historical daily records? We strongly recommend exporting a JSON backup first.`}
        confirmLabel="Erase All Records"
        confirmVariant="danger"
        onConfirm={() => {
          if (onClearAllRecords) {
            onClearAllRecords();
            setClearedAlert(true);
            setTimeout(() => setClearedAlert(false), 2500);
          }
        }}
        onClose={() => setIsClearAllConfirmOpen(false)}
      />

      {/* JSON Restore Confirmation Modal */}
      {pendingRestore && (
        <RestoreModal
          isOpen={!!pendingRestore}
          backupData={pendingRestore}
          currentRecordsCount={recordsCount}
          currentDisciplinesCount={settings.disciplines.length}
          onConfirm={(strategy) => {
            if (onRestoreBackup && pendingRestore) {
              onRestoreBackup(pendingRestore, strategy);
              setRestoreSuccess(
                `Successfully restored ${pendingRestore.records.length} records and ${pendingRestore.settings.disciplines.length} disciplines (${strategy} strategy)!`
              );
              setTimeout(() => setRestoreSuccess(null), 4000);
            }
            setPendingRestore(null);
          }}
          onClose={() => setPendingRestore(null)}
        />
      )}
    </div>
  );
};

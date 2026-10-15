import { DailyRecord, UserSettings, ActivityDiscipline } from '../types';
import { computeDailyRecord } from '../data/productivityStore';

export interface ProductivityBackup {
  version: string;
  exportedAt: string;
  appName: string;
  settings: UserSettings;
  records: DailyRecord[];
}

export type ProductivityBackupData = ProductivityBackup;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
  data?: ProductivityBackup;
  backupData?: ProductivityBackup;
  summary?: {
    recordCount: number;
    disciplineCount: number;
    dateRange?: { start: string; end: string };
    exportedAt?: string;
  };
}

const STORAGE_KEY_SNAPSHOT = 'productivity_os_safety_snapshot_v1';

/**
 * Creates a structured backup payload
 */
export function createBackupPayload(
  records: DailyRecord[],
  settings: UserSettings
): ProductivityBackup {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appName: 'ProductivityOS',
    settings: {
      ...settings,
      disciplines: settings.disciplines || [],
    },
    records: [...records].sort((a, b) => b.date.localeCompare(a.date)),
  };
}

/**
 * Serializes the complete application state to formatted JSON
 */
export function exportBackupJSON(
  records: DailyRecord[],
  settings: UserSettings
): string {
  const payload = createBackupPayload(records, settings);
  return JSON.stringify(payload, null, 2);
}

/**
 * Triggers a download of the full JSON backup file in the desktop browser/Electron window.
 * Accepts either pre-serialized JSON string, or (records, settings), or ProductivityBackup object.
 */
export function downloadBackupFile(
  contentOrRecords: string | DailyRecord[] | ProductivityBackup,
  settings?: UserSettings
): void {
  let jsonContent: string;
  if (typeof contentOrRecords === 'string') {
    jsonContent = contentOrRecords;
  } else if (Array.isArray(contentOrRecords)) {
    if (!settings) {
      throw new Error('settings is required when passing DailyRecord[] to downloadBackupFile');
    }
    jsonContent = exportBackupJSON(contentOrRecords, settings);
  } else if (typeof contentOrRecords === 'object' && contentOrRecords !== null) {
    jsonContent = JSON.stringify(contentOrRecords, null, 2);
  } else {
    throw new Error('Invalid argument passed to downloadBackupFile');
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
  const filename = `ProductivityOS_Backup_${dateStr}_${timeStr}.json`;

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Takes an automated safety snapshot in localStorage before any bulk restore or clear.
 * Verifies that the snapshot was written to localStorage successfully and returns a boolean.
 */
export function saveSafetySnapshot(
  records: DailyRecord[],
  settings: UserSettings
): boolean {
  try {
    const payload = createBackupPayload(records, settings);
    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY_SNAPSHOT, serialized);
    const verified = localStorage.getItem(STORAGE_KEY_SNAPSHOT);
    return verified !== null && verified.length === serialized.length;
  } catch (err) {
    console.warn('Failed to save safety snapshot to localStorage:', err);
    return false;
  }
}

/**
 * Retrieves the last safety snapshot if one exists
 */
export function getSafetySnapshot(): ProductivityBackup | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.records)) {
      return parsed as ProductivityBackup;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Rigorously validates an imported JSON string before allowing restoration
 */
export function validateBackupJSON(jsonString: string): ValidationResult {
  const fail = (msg: string): ValidationResult => ({
    isValid: false,
    error: msg,
    errors: [msg],
  });

  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    return fail('The provided file is empty.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return fail(`Invalid JSON syntax: ${err.message || 'Could not parse JSON structure.'}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return fail('Backup file must contain a root JSON object containing settings and records.');
  }

  // Check if either records or settings is present
  const hasRecords = Array.isArray(parsed.records);
  const hasSettings = parsed.settings && typeof parsed.settings === 'object';

  if (!hasRecords && !hasSettings) {
    return fail('Backup file must contain at least a valid "records" array or "settings" object.');
  }

  // Validate settings if present
  const validatedDisciplines: ActivityDiscipline[] = [];
  if (hasSettings && Array.isArray(parsed.settings.disciplines)) {
    for (let i = 0; i < parsed.settings.disciplines.length; i++) {
      const d = parsed.settings.disciplines[i];
      if (!d || typeof d !== 'object') {
        return fail(`Discipline at index ${i} is not a valid object.`);
      }
      if (!d.id || typeof d.id !== 'string') {
        return fail(`Discipline at index ${i} is missing a required string ID.`);
      }
      if (!d.name || typeof d.name !== 'string') {
        return fail(`Discipline "${d.id}" is missing a valid name.`);
      }

      validatedDisciplines.push({
        id: String(d.id),
        name: String(d.name),
        tagline: d.tagline ? String(d.tagline) : '',
        category: d.category ? String(d.category) : 'General',
        cadence: d.cadence === 'weekly' ? 'weekly' : 'daily',
        targetMinutes: typeof d.targetMinutes === 'number' && d.targetMinutes >= 0 ? d.targetMinutes : 60,
        weeklyTargetCount: d.cadence === 'weekly' ? (typeof d.weeklyTargetCount === 'number' ? d.weeklyTargetCount : 1) : undefined,
        color: d.color && typeof d.color === 'string' ? d.color : '#4F46E5',
        icon: d.icon && typeof d.icon === 'string' ? d.icon : 'activity',
        isActive: d.isActive !== false,
        isArchived: d.isArchived === true,
        createdAt: d.createdAt ? String(d.createdAt) : new Date().toISOString(),
        archivedAt: d.archivedAt ? String(d.archivedAt) : undefined,
        order: typeof d.order === 'number' ? d.order : i,
      });
    }
  }

  // Validate records if present
  const validatedRecords: DailyRecord[] = [];
  if (hasRecords) {
    for (let i = 0; i < parsed.records.length; i++) {
      const r = parsed.records[i];
      if (!r || typeof r !== 'object') {
        return fail(`Record at index ${i} is not a valid object.`);
      }
      if (!r.date || typeof r.date !== 'string') {
        return fail(`Record at index ${i} is missing a required date string.`);
      }

      // Check date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(r.date.trim())) {
        return fail(`Record at index ${i} has an invalid date format: "${r.date}". Expected YYYY-MM-DD.`);
      }

      // Ensure activityActuals is an object
      const actuals: Record<string, number> = {};
      if (r.activityActuals && typeof r.activityActuals === 'object') {
        for (const [k, v] of Object.entries(r.activityActuals)) {
          if (typeof v === 'number' && !isNaN(v)) {
            actuals[k] = Math.max(0, v);
          }
        }
      }

      const targets: Record<string, number> = {};
      if (r.activityTargets && typeof r.activityTargets === 'object') {
        for (const [k, v] of Object.entries(r.activityTargets)) {
          if (typeof v === 'number' && !isNaN(v)) {
            targets[k] = Math.max(0, v);
          }
        }
      }

      const pcts: Record<string, number> = {};
      if (r.activityPcts && typeof r.activityPcts === 'object') {
        for (const [k, v] of Object.entries(r.activityPcts)) {
          if (typeof v === 'number' && !isNaN(v)) {
            pcts[k] = Math.max(0, v);
          }
        }
      }

      const weeklyCompleted: Record<string, boolean> = {};
      if (r.weeklyCompleted && typeof r.weeklyCompleted === 'object') {
        for (const [k, v] of Object.entries(r.weeklyCompleted)) {
          weeklyCompleted[k] = Boolean(v);
        }
      }

      validatedRecords.push({
        id: r.id ? String(r.id) : r.date.trim(),
        date: r.date.trim(),
        day: r.day ? String(r.day) : '',
        week: typeof r.week === 'number' ? r.week : 1,
        month: r.month ? String(r.month) : r.date.trim().slice(0, 7),
        year: typeof r.year === 'number' ? r.year : parseInt(r.date.trim().slice(0, 4), 10),
        activityActuals: actuals,
        activityTargets: targets,
        activityPcts: pcts,
        activityPercentages: pcts,
        weeklyCompleted,
        totalTarget: typeof r.totalTarget === 'number' ? r.totalTarget : 0,
        totalActual: typeof r.totalActual === 'number' ? r.totalActual : 0,
        overallPct: typeof r.overallPct === 'number' ? r.overallPct : 0,
        status: (['COMPLETED', 'GOOD', 'PARTIAL', 'LOW'].includes(r.status) ? r.status : 'LOW') as any,
        notes: r.notes ? String(r.notes) : '',
      });
    }
  }

  // Check version compatibility if present
  if (parsed.version !== undefined) {
    const vStr = String(parsed.version).trim();
    if (!vStr.startsWith('1')) {
      const err = `Unsupported backup version: "${vStr}". This version of ProductivityOS only supports version 1.x backups.`;
      return {
        isValid: false,
        error: err,
        errors: [err],
      };
    }
  }

  // Determine summary metrics
  const sortedDates = validatedRecords.map((r) => r.date).sort();
  const summary = {
    recordCount: validatedRecords.length,
    disciplineCount: validatedDisciplines.length,
    dateRange: sortedDates.length > 0 ? { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] } : undefined,
    exportedAt: parsed.exportedAt || undefined,
  };

  const validatedData: ProductivityBackup = {
    version: parsed.version || '1.0',
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    appName: parsed.appName || 'ProductivityOS',
    settings: {
      disciplines: validatedDisciplines.length > 0 ? validatedDisciplines : (parsed.settings?.disciplines || []),
      theme: parsed.settings?.theme === 'dark' ? 'dark' : 'light',
      connectedSpreadsheetId: parsed.settings?.connectedSpreadsheetId,
      connectedSpreadsheetUrl: parsed.settings?.connectedSpreadsheetUrl,
    },
    records: validatedRecords,
  };

  return {
    isValid: true,
    data: validatedData,
    backupData: validatedData,
    summary,
  };
}

/**
 * Applies a verified backup to existing application state
 */
export function applyRestoredBackup(
  backup: ProductivityBackup,
  currentSettings: UserSettings,
  currentRecords: DailyRecord[],
  mode: 'replace' | 'merge' = 'replace'
): {
  settings: UserSettings;
  records: DailyRecord[];
  updatedSettings: UserSettings;
  updatedRecords: DailyRecord[];
} {
  if (mode === 'replace') {
    // Preserve any existing settings properties if backup omitted them
    const newSettings: UserSettings = {
      ...currentSettings,
      ...backup.settings,
      disciplines: backup.settings.disciplines && backup.settings.disciplines.length > 0
        ? backup.settings.disciplines
        : currentSettings.disciplines,
    };

    // Recompute records with the new settings to ensure mathematical integrity
    const updatedRecords = (backup.records || []).map((r) =>
      computeDailyRecord(
        r.date,
        r.activityActuals || {},
        newSettings,
        r.notes || '',
        r.weeklyCompleted || {}
      )
    ).sort((a, b) => b.date.localeCompare(a.date));

    return {
      settings: newSettings,
      records: updatedRecords,
      updatedSettings: newSettings,
      updatedRecords,
    };
  } else {
    // Merge mode: combine disciplines by ID
    const disciplineMap = new Map<string, ActivityDiscipline>();
    currentSettings.disciplines.forEach((d) => disciplineMap.set(d.id, d));
    (backup.settings.disciplines || []).forEach((d) => disciplineMap.set(d.id, d));
    const mergedDisciplines = Array.from(disciplineMap.values());

    const mergedSettings: UserSettings = {
      ...currentSettings,
      ...backup.settings,
      disciplines: mergedDisciplines,
    };

    // Merge records by date
    const recordMap = new Map<string, DailyRecord>();
    currentRecords.forEach((r) => recordMap.set(r.date, r));
    (backup.records || []).forEach((r) => {
      const existing = recordMap.get(r.date);
      if (existing) {
        // Merge actuals
        const mergedActuals = { ...(existing.activityActuals || {}), ...(r.activityActuals || {}) };
        const mergedWeekly = { ...(existing.weeklyCompleted || {}), ...(r.weeklyCompleted || {}) };
        const mergedNotes = r.notes ? (existing.notes ? `${existing.notes} | ${r.notes}` : r.notes) : existing.notes;
        recordMap.set(r.date, computeDailyRecord(r.date, mergedActuals, mergedSettings, mergedNotes, mergedWeekly));
      } else {
        recordMap.set(r.date, computeDailyRecord(r.date, r.activityActuals || {}, mergedSettings, r.notes, r.weeklyCompleted || {}));
      }
    });

    const updatedRecords = Array.from(recordMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    return {
      settings: mergedSettings,
      records: updatedRecords,
      updatedSettings: mergedSettings,
      updatedRecords,
    };
  }
}

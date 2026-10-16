import React, { useState, useEffect, useCallback } from 'react';
import { ViewTab, DailyRecord, UserSettings, ActivityDiscipline } from './types';
import {
  DEFAULT_SETTINGS,
  calculateStreaks,
  computeDailyRecord,
} from './data/productivityStore';
import {
  exportBackupJSON,
  downloadBackupFile,
  saveSafetySnapshot,
  applyRestoredBackup,
  ProductivityBackupData,
} from './services/backupRestoreService';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DailyTrackerView } from './components/DailyTrackerView';
import { TimeAnalyticsView } from './components/TimeAnalyticsView';
import { DomainAnalyticsView } from './components/DomainAnalyticsView';
import { SettingsView } from './components/SettingsView';
import { SheetsPlanView } from './components/SheetsPlanView';
import { ReadmeView } from './components/ReadmeView';
import { DailyLogModal } from './components/DailyLogModal';
import { AddDisciplineModal } from './components/AddDisciplineModal';
import { AdvancedAnalyticsView } from './components/AdvancedAnalyticsView';
import { ProductivityHeatmap } from './components/ProductivityHeatmap';
import { ActivityManagementView } from './components/ActivityManagementView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Plus, FileSpreadsheet, Sun, Moon, Calendar, Layers, BarChart3, Clock } from 'lucide-react';

const STORAGE_KEY_RECORDS = 'productivity_os_daily_records_clean_v1';
const STORAGE_KEY_SETTINGS = 'productivity_os_settings_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
      const newToast: ToastMessage = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        title,
        message,
      };
      setToasts((prev) => [...prev.slice(-4), newToast]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load or initialize settings safely
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.disciplines)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Load daily records non-destructively with automatic legacy migration fallback
  const [records, setRecords] = useState<DailyRecord[]>(() => {
    try {
      const savedClean = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (savedClean) {
        const parsed = JSON.parse(savedClean);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Non-destructive fallback check for legacy key: NEVER delete historical data
      const legacySaved = localStorage.getItem('productivity_os_daily_records_v1');
      if (legacySaved) {
        const parsedLegacy = JSON.parse(legacySaved);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          localStorage.setItem(STORAGE_KEY_RECORDS, legacySaved);
          return parsedLegacy;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyRecord | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);

  const [isAddDisciplineOpen, setIsAddDisciplineOpen] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<ActivityDiscipline | undefined>(undefined);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Synchronize dark theme class with document element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  // Handlers for Daily Log
  const handleOpenLogModal = useCallback((date?: string, existing?: DailyRecord) => {
    setTargetDate(date || new Date().toISOString().split('T')[0]);
    setEditingRecord(existing || records.find((r) => r.date === date));
    setIsLogModalOpen(true);
  }, [records]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      // Escape always closes open modals
      if (e.key === 'Escape') {
        if (isLogModalOpen) {
          setIsLogModalOpen(false);
          setEditingRecord(undefined);
          setTargetDate(undefined);
        } else if (isAddDisciplineOpen) {
          setIsAddDisciplineOpen(false);
          setEditingDiscipline(undefined);
        }
        return;
      }

      // If user is typing in form controls, don't trigger navigation shortcuts
      if (isInput) return;

      // Ctrl+N or Cmd+N: Quick Log
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleOpenLogModal();
        return;
      }

      // Quick numbers navigation with Alt or Ctrl
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setCurrentTab('dashboard');
        } else if (e.key === '2') {
          e.preventDefault();
          setCurrentTab('tracker');
        } else if (e.key === '3') {
          e.preventDefault();
          setCurrentTab('analytics');
        } else if (e.key === '4') {
          e.preventDefault();
          setCurrentTab('history');
        } else if (e.key === '5') {
          e.preventDefault();
          setCurrentTab('activities');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogModalOpen, isAddDisciplineOpen, handleOpenLogModal]);

  // Overall streaks
  const overallStreaks = calculateStreaks(records, (r) => r.overallPct >= 80);
  const todayRecord = records[0] || null;

  const handleSaveRecord = (newRecord: DailyRecord, previousDate?: string) => {
    setRecords((prev) => {
      let list = prev;
      if (previousDate && previousDate !== newRecord.date) {
        list = list.filter((r) => r.date !== previousDate && r.id !== previousDate);
      }
      const existsIndex = list.findIndex((r) => r.date === newRecord.date);
      if (existsIndex >= 0) {
        const copy = [...list];
        copy[existsIndex] = {
          ...newRecord,
          id: copy[existsIndex].id || newRecord.id || newRecord.date,
          createdAt: copy[existsIndex].createdAt || newRecord.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return copy.sort((a, b) => b.date.localeCompare(a.date));
      } else {
        const toAdd: DailyRecord = {
          ...newRecord,
          id: newRecord.id || newRecord.date,
          createdAt: newRecord.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [toAdd, ...list].sort((a, b) => b.date.localeCompare(a.date));
      }
    });

    showToast('success', 'Daily Performance Saved', `Performance record for ${newRecord.date} updated.`);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id && r.date !== id));
    showToast('info', 'Record Deleted', 'Daily productivity entry removed.');
  };

  const handleClearAllRecords = () => {
    // Take safety snapshot before clearing so user can recover if accidental
    saveSafetySnapshot(records, settings);
    setRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS);
    } catch {
      // ignore
    }
    showToast('warning', 'All Records Cleared', 'A recovery safety snapshot was preserved.');
  };

  // Handlers for Activity Disciplines
  const handleOpenAddDiscipline = () => {
    setEditingDiscipline(undefined);
    setIsAddDisciplineOpen(true);
  };

  const handleOpenEditDiscipline = (disc: ActivityDiscipline) => {
    setEditingDiscipline(disc);
    setIsAddDisciplineOpen(true);
  };

  const handleSaveDiscipline = (newOrUpdated: ActivityDiscipline) => {
    let updatedDisciplines: ActivityDiscipline[];
    const exists = settings.disciplines.some((d) => d.id === newOrUpdated.id);

    if (exists) {
      updatedDisciplines = settings.disciplines.map((d) =>
        d.id === newOrUpdated.id ? newOrUpdated : d
      );
    } else {
      updatedDisciplines = [...settings.disciplines, newOrUpdated];
    }

    const newSettings: UserSettings = {
      ...settings,
      disciplines: updatedDisciplines,
    };

    setSettings(newSettings);

    // Recompute all records with new discipline target setup, preserving existing IDs and timestamps
    setRecords((prev) =>
      prev.map((r) =>
        computeDailyRecord(
          r.date,
          r.activityActuals || {},
          newSettings,
          r.notes,
          r.weeklyCompleted || {},
          { id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt }
        )
      )
    );

    setIsAddDisciplineOpen(false);
    setEditingDiscipline(undefined);
    showToast('success', 'Discipline Configured', `Saved discipline "${newOrUpdated.name}".`);
  };

  // Safe non-destructive discipline archiving: preserves historical records
  const handleArchiveDiscipline = (disciplineId: string, shouldArchive: boolean = true) => {
    const updatedDisciplines = settings.disciplines.map((d) =>
      d.id === disciplineId
        ? {
            ...d,
            isArchived: shouldArchive,
            isActive: shouldArchive ? false : true,
            archivedAt: shouldArchive ? new Date().toISOString() : undefined,
          }
        : d
    );
    const newSettings: UserSettings = {
      ...settings,
      disciplines: updatedDisciplines,
    };

    setSettings(newSettings);

    if (currentTab === disciplineId && shouldArchive) {
      setCurrentTab('dashboard');
    }

    // Non-destructive: preserves activityActuals in past records!
    setRecords((prev) =>
      prev.map((r) =>
        computeDailyRecord(
          r.date,
          r.activityActuals || {},
          newSettings,
          r.notes,
          r.weeklyCompleted || {},
          { id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt }
        )
      )
    );

    setIsAddDisciplineOpen(false);
    setEditingDiscipline(undefined);
    showToast(
      'info',
      shouldArchive ? 'Discipline Archived' : 'Discipline Restored',
      `Historical data preserved.`
    );
  };

  // Safe non-destructive discipline removal from roster: PRESERVES historical minutes in activityActuals!
  const handleDeleteDiscipline = (disciplineId: string) => {
    const target = settings.disciplines.find((d) => d.id === disciplineId);
    const updatedDisciplines = settings.disciplines.filter((d) => d.id !== disciplineId);
    const newSettings: UserSettings = {
      ...settings,
      disciplines: updatedDisciplines,
    };

    setSettings(newSettings);

    if (currentTab === disciplineId) {
      setCurrentTab('dashboard');
    }

    // Non-destructive: keeps all historical activityActuals intact!
    setRecords((prev) =>
      prev.map((r) =>
        computeDailyRecord(
          r.date,
          r.activityActuals || {},
          newSettings,
          r.notes,
          r.weeklyCompleted || {},
          { id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt }
        )
      )
    );

    setIsAddDisciplineOpen(false);
    setEditingDiscipline(undefined);
    showToast('info', 'Discipline Removed', `"${target?.name || disciplineId}" removed from roster. Historical minutes preserved.`);
  };

  // Backup & Restore Handlers
  const handleExportBackup = () => {
    const jsonString = exportBackupJSON(records, settings);
    downloadBackupFile(jsonString);
    showToast('success', 'Backup Exported', 'JSON backup file successfully generated.');
  };

  const handleRestoreBackup = (
    backupData: ProductivityBackupData,
    strategy: 'replace' | 'merge'
  ) => {
    // Step 1: Automatic pre-restore safety snapshot
    const snapshotSaved = saveSafetySnapshot(records, settings);
    if (!snapshotSaved) {
      console.warn('Safety snapshot could not be verified in localStorage before restoring.');
    }

    // Step 2: Apply restored state safely
    const result = applyRestoredBackup(backupData, settings, records, strategy);
    setSettings(result.settings);
    setRecords(result.records);
    showToast('success', 'Backup Restored', `Loaded ${result.records.length} records (${strategy} mode).`);
  };

  // Determine active view label
  const matchingDiscipline = settings.disciplines.find((d) => d.id === currentTab);

  const getTabLabel = (tab: ViewTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview';
      case 'tracker':
        return 'Daily Tracker';
      case 'analytics':
        return 'Analytics & Insights';
      case 'history':
        return 'Productivity History';
      case 'activities':
        return 'Activity Management';
      case 'weekly':
        return 'Weekly Trends';
      case 'monthly':
        return 'Monthly Pace';
      case 'yearly':
        return 'Yearly Review';
      case 'settings':
        return 'Settings';
      case 'sheetsPlan':
        return '13-Sheet System Spec';
      case 'readme':
        return 'System Protocol & Guide';
      default:
        return matchingDiscipline
          ? `${matchingDiscipline.name} (${matchingDiscipline.cadence === 'weekly' ? 'Weekly' : 'Daily'}${matchingDiscipline.isArchived ? ' - Archived' : ''})`
          : tab;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 flex text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Persistent SaaS Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        todayStatus={todayRecord?.status || 'LOW'}
        currentStreak={overallStreaks.current}
        settings={settings}
        onOpenAddDiscipline={handleOpenAddDiscipline}
        onOpenQuickLog={() => handleOpenLogModal()}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Floating App Bar */}
        <header className="h-14 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              ProductivityOS
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {getTabLabel(currentTab)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
                setSettings((prev) => ({ ...prev, theme: newTheme }));
                showToast('info', `Switched to ${newTheme} theme`);
              }}
              title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-neutral-600" />
              )}
            </button>

            <button
              onClick={() => setCurrentTab('sheetsPlan')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">13-Sheet Plan</span>
            </button>

            <button
              onClick={() => handleOpenLogModal()}
              title="Shortcut: Ctrl+N"
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Performance</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Content */}
        <div className="flex-1 p-6 md:p-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              records={records}
              settings={settings}
              onOpenLogModal={handleOpenLogModal}
              onOpenAddDiscipline={handleOpenAddDiscipline}
              onSelectDiscipline={(id) => setCurrentTab(id)}
            />
          )}

          {currentTab === 'tracker' && (
            <DailyTrackerView
              records={records}
              settings={settings}
              onOpenLogModal={handleOpenLogModal}
              onDeleteRecord={handleDeleteRecord}
              onOpenAddDiscipline={handleOpenAddDiscipline}
            />
          )}

          {currentTab === 'analytics' && (
            <AdvancedAnalyticsView
              records={records}
              settings={settings}
              initialPeriod="30d"
              onOpenLogModal={handleOpenLogModal}
              onSelectDiscipline={(id) => setCurrentTab(id)}
            />
          )}

          {currentTab === 'history' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <ProductivityHeatmap
                records={records}
                settings={settings}
                onSelectDate={(date, rec) => handleOpenLogModal(date, rec)}
              />
            </div>
          )}

          {currentTab === 'activities' && (
            <ActivityManagementView
              settings={settings}
              records={records}
              onOpenAddDiscipline={handleOpenAddDiscipline}
              onEditDiscipline={handleOpenEditDiscipline}
              onArchiveDiscipline={handleArchiveDiscipline}
              onDeleteDiscipline={handleDeleteDiscipline}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                setRecords((prev) =>
                  prev.map((r) =>
                    computeDailyRecord(
                      r.date,
                      r.activityActuals || {},
                      newSettings,
                      r.notes,
                      r.weeklyCompleted || {},
                      { id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt }
                    )
                  )
                );
              }}
              onSelectDiscipline={(id) => setCurrentTab(id)}
            />
          )}

          {currentTab === 'weekly' && (
            <AdvancedAnalyticsView
              records={records}
              settings={settings}
              initialPeriod="this_week"
              onOpenLogModal={handleOpenLogModal}
              onSelectDiscipline={(id) => setCurrentTab(id)}
            />
          )}

          {currentTab === 'monthly' && (
            <AdvancedAnalyticsView
              records={records}
              settings={settings}
              initialPeriod="this_month"
              onOpenLogModal={handleOpenLogModal}
              onSelectDiscipline={(id) => setCurrentTab(id)}
            />
          )}

          {currentTab === 'yearly' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <ProductivityHeatmap
                records={records}
                settings={settings}
                onSelectDate={(date, rec) => handleOpenLogModal(date, rec)}
              />
              <AdvancedAnalyticsView
                records={records}
                settings={settings}
                initialPeriod="this_year"
                onOpenLogModal={handleOpenLogModal}
                onSelectDiscipline={(id) => setCurrentTab(id)}
              />
            </div>
          )}

          {matchingDiscipline && (
            <DomainAnalyticsView
              activityId={matchingDiscipline.id}
              records={records}
              settings={settings}
              onEditDiscipline={handleOpenEditDiscipline}
              onDeleteDiscipline={handleDeleteDiscipline}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              records={records}
              recordsCount={records.length}
              onClearAllRecords={handleClearAllRecords}
              onOpenAddDiscipline={handleOpenAddDiscipline}
              onEditDiscipline={handleOpenEditDiscipline}
              onDeleteDiscipline={handleDeleteDiscipline}
              onArchiveDiscipline={handleArchiveDiscipline}
              onExportBackup={handleExportBackup}
              onRestoreBackup={handleRestoreBackup}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                setRecords((prev) =>
                  prev.map((r) =>
                    computeDailyRecord(
                      r.date,
                      r.activityActuals || {},
                      newSettings,
                      r.notes,
                      r.weeklyCompleted || {},
                      { id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt }
                    )
                  )
                );
              }}
            />
          )}

          {currentTab === 'sheetsPlan' && <SheetsPlanView />}

          {currentTab === 'readme' && (
            <ReadmeView
              settings={settings}
              onOpenAddDiscipline={handleOpenAddDiscipline}
              onSelectDiscipline={(id) => setCurrentTab(id)}
            />
          )}
        </div>
      </main>

      {/* Daily Entry Modal */}
      <DailyLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingRecord(undefined);
          setTargetDate(undefined);
        }}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        onOpenAddDiscipline={handleOpenAddDiscipline}
        initialDate={targetDate}
        existingRecord={editingRecord}
        settings={settings}
        allRecords={records}
      />

      {/* Add / Edit Activity Discipline Modal */}
      <AddDisciplineModal
        isOpen={isAddDisciplineOpen}
        onClose={() => {
          setIsAddDisciplineOpen(false);
          setEditingDiscipline(undefined);
        }}
        onSave={handleSaveDiscipline}
        onDelete={handleDeleteDiscipline}
        onArchive={handleArchiveDiscipline}
        existingDiscipline={editingDiscipline}
      />
    </div>
  );
}

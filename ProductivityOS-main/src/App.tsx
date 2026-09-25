import React, { useState, useEffect } from 'react';
import { ViewTab, DailyRecord, UserSettings, ActivityDiscipline } from './types';
import {
  DEFAULT_SETTINGS,
  calculateStreaks,
  computeDailyRecord,
} from './data/productivityStore';
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
import { Plus, FileSpreadsheet } from 'lucide-react';

const STORAGE_KEY_RECORDS = 'productivity_os_daily_records_clean_v1';
const STORAGE_KEY_SETTINGS = 'productivity_os_settings_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Load or initialize settings
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

  // Load daily records - empty by default (zero demo data)
  const [records, setRecords] = useState<DailyRecord[]>(() => {
    try {
      localStorage.removeItem('productivity_os_daily_records_v1');
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  // Overall streaks
  const overallStreaks = calculateStreaks(records, (r) => r.overallPct >= 80);
  const todayRecord = records[0] || null;

  // Handlers for Daily Log
  const handleOpenLogModal = (date?: string, existing?: DailyRecord) => {
    setTargetDate(date || new Date().toISOString().split('T')[0]);
    setEditingRecord(existing || records.find((r) => r.date === date));
    setIsLogModalOpen(true);
  };

  const handleSaveRecord = (newRecord: DailyRecord) => {
    setRecords((prev) => {
      const existsIndex = prev.findIndex((r) => r.date === newRecord.date);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = newRecord;
        return copy.sort((a, b) => b.date.localeCompare(a.date));
      } else {
        return [newRecord, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      }
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id && r.date !== id));
  };

  const handleClearAllRecords = () => {
    setRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem('productivity_os_daily_records_v1');
    } catch {
      // ignore
    }
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

    // Recompute all records with new discipline target setup
    setRecords((prev) =>
      prev.map((r) =>
        computeDailyRecord(
          r.date,
          r.activityActuals || {},
          newSettings,
          r.notes,
          r.weeklyCompleted || {}
        )
      )
    );

    setIsAddDisciplineOpen(false);
    setEditingDiscipline(undefined);
  };

  const handleDeleteDiscipline = (disciplineId: string) => {
    const updatedDisciplines = settings.disciplines.filter((d) => d.id !== disciplineId);
    const newSettings: UserSettings = {
      ...settings,
      disciplines: updatedDisciplines,
    };

    setSettings(newSettings);

    // If currently viewing the deleted discipline, go back to dashboard
    if (currentTab === disciplineId) {
      setCurrentTab('dashboard');
    }

    // Recompute records
    setRecords((prev) =>
      prev.map((r) => {
        const nextActuals = { ...(r.activityActuals || {}) };
        delete nextActuals[disciplineId];
        return computeDailyRecord(r.date, nextActuals, newSettings, r.notes, r.weeklyCompleted || {});
      })
    );
  };

  // Determine active view
  const matchingDiscipline = settings.disciplines.find((d) => d.id === currentTab);

  return (
    <div className="min-h-screen bg-neutral-50/50 flex text-neutral-900 font-sans">
      {/* SaaS Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        todayStatus={todayRecord?.status || 'LOW'}
        currentStreak={overallStreaks.current}
        settings={settings}
        onOpenAddDiscipline={handleOpenAddDiscipline}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Floating App Bar */}
        <header className="h-14 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xs px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider">
              Productivity OS
            </span>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-semibold text-neutral-800 capitalize">
              {matchingDiscipline
                ? `${matchingDiscipline.name} (${matchingDiscipline.cadence === 'weekly' ? 'Weekly' : 'Daily'})`
                : currentTab.replace(/([A-Z])/g, ' $1')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('sheetsPlan')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>13-Sheet Plan</span>
            </button>

            <button
              onClick={() => handleOpenLogModal()}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
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

          {currentTab === 'weekly' && (
            <TimeAnalyticsView records={records} settings={settings} mode="weekly" />
          )}

          {currentTab === 'monthly' && (
            <TimeAnalyticsView records={records} settings={settings} mode="monthly" />
          )}

          {currentTab === 'yearly' && (
            <TimeAnalyticsView records={records} settings={settings} mode="yearly" />
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
              recordsCount={records.length}
              onClearAllRecords={handleClearAllRecords}
              onOpenAddDiscipline={handleOpenAddDiscipline}
              onEditDiscipline={handleOpenEditDiscipline}
              onDeleteDiscipline={handleDeleteDiscipline}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                // recompute all records
                setRecords((prev) =>
                  prev.map((r) =>
                    computeDailyRecord(
                      r.date,
                      r.activityActuals || {},
                      newSettings,
                      r.notes,
                      r.weeklyCompleted || {}
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
        existingDiscipline={editingDiscipline}
      />
    </div>
  );
}

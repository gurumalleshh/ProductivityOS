import React, { useState } from 'react';
import { UserSettings, ActivityDiscipline, DailyRecord } from '../types';
import { formatMinutes } from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  Sparkles,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Clock,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ActivityManagementViewProps {
  settings: UserSettings;
  records: DailyRecord[];
  onOpenAddDiscipline: () => void;
  onEditDiscipline: (discipline: ActivityDiscipline) => void;
  onArchiveDiscipline: (id: string, shouldArchive: boolean) => void;
  onDeleteDiscipline: (id: string) => void;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onSelectDiscipline?: (id: string) => void;
}

export const ActivityManagementView: React.FC<ActivityManagementViewProps> = ({
  settings,
  records,
  onOpenAddDiscipline,
  onEditDiscipline,
  onArchiveDiscipline,
  onDeleteDiscipline,
  onUpdateSettings,
  onSelectDiscipline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCadence, setFilterCadence] = useState<'all' | 'daily' | 'weekly'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const activeDisciplines = settings.disciplines.filter(
    (d) => d.isActive !== false && !d.isArchived
  );
  const archivedDisciplines = settings.disciplines.filter(
    (d) => d.isArchived || d.isActive === false
  );

  const dailyBenchmark = activeDisciplines
    .filter((d) => d.cadence === 'daily')
    .reduce((sum, d) => sum + d.targetMinutes, 0);

  // Filtered active list
  const filteredActive = activeDisciplines.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.tagline && d.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCadence = filterCadence === 'all' || d.cadence === filterCadence;
    return matchesSearch && matchesCadence;
  });

  // Reordering handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const currentList = [...activeDisciplines];
    const temp = currentList[index];
    currentList[index] = currentList[index - 1];
    currentList[index - 1] = temp;

    // Re-index orders
    const updated = currentList.map((d, i) => ({ ...d, order: i + 1 }));
    // Merge with archived
    onUpdateSettings({
      ...settings,
      disciplines: [...updated, ...archivedDisciplines],
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= activeDisciplines.length - 1) return;
    const currentList = [...activeDisciplines];
    const temp = currentList[index];
    currentList[index] = currentList[index + 1];
    currentList[index + 1] = temp;

    const updated = currentList.map((d, i) => ({ ...d, order: i + 1 }));
    onUpdateSettings({
      ...settings,
      disciplines: [...updated, ...archivedDisciplines],
    });
  };

  // Historical lifetime minutes per discipline
  const getDisciplineLifetimeMinutes = (disciplineId: string) => {
    return records.reduce((sum, r) => sum + (r.activityActuals?.[disciplineId] || 0), 0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Activity Discipline Management
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {activeDisciplines.length} Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Configure daily targets, icons, colors, display ordering, and non-destructive archiving.
          </p>
        </div>

        <button
          onClick={onOpenAddDiscipline}
          className="px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Discipline</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Daily Benchmark</div>
          <div className="mt-1 text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {formatMinutes(dailyBenchmark)}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            {activeDisciplines.filter((d) => d.cadence === 'daily').length} daily disciplines
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Weekly Cadence</div>
          <div className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {activeDisciplines.filter((d) => d.cadence === 'weekly').length}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Special once-a-week goals
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Archived Activities</div>
          <div className="mt-1 text-2xl font-bold font-mono text-neutral-600 dark:text-neutral-400">
            {archivedDisciplines.length}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Preserved historical minutes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Tracked Records</div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {records.length}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Historical day sessions
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search disciplines by name, category..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {(['all', 'daily', 'weekly'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterCadence(c)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer capitalize ${
                  filterCadence === c
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Disciplines Table / List */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Active Activity Disciplines ({filteredActive.length})
            </h2>
            <span className="text-[11px] text-neutral-400">
              Use arrows to adjust dashboard display order
            </span>
          </div>
        </div>

        {filteredActive.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              No active disciplines match your criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredActive.map((discipline, index) => {
              const lifetimeMins = getDisciplineLifetimeMinutes(discipline.id);
              return (
                <div
                  key={discipline.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5 items-center shrink-0">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[10px] text-neutral-400">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === filteredActive.length - 1}
                        title="Move Down"
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Icon Badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: discipline.color }}
                    >
                      <DisciplineIcon name={discipline.icon} className="w-5 h-5" />
                    </div>

                    {/* Meta */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => onSelectDiscipline && onSelectDiscipline(discipline.id)}
                          className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          title={discipline.name}
                        >
                          {discipline.name}
                        </h3>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 capitalize">
                          {discipline.category}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                            discipline.cadence === 'weekly'
                              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {discipline.cadence === 'weekly' ? 'Weekly' : 'Daily'}
                        </span>
                      </div>
                      {discipline.tagline && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                          {discipline.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Target & Actions */}
                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {formatMinutes(discipline.targetMinutes)}
                        <span className="text-[10px] text-neutral-400 font-normal">
                          {discipline.cadence === 'weekly' ? '/wk' : '/day'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400">
                        Lifetime: {Math.round(lifetimeMins / 60)}h {lifetimeMins % 60}m
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditDiscipline(discipline)}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit name, target, color, or icon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={() => onArchiveDiscipline(discipline.id, true)}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 text-neutral-600 dark:text-neutral-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Safely archive discipline (historical data preserved)"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Archive</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Archived Disciplines Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Archived Activities ({archivedDisciplines.length})
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Activities removed from active daily tracking. All historical sessions and minutes are 100% preserved.
            </p>
          </div>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>

        {showArchived && (
          <div className="pt-2">
            {archivedDisciplines.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg">
                No archived activities.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                {archivedDisciplines.map((d) => {
                  const lifetimeMins = getDisciplineLifetimeMinutes(d.id);
                  return (
                    <div
                      key={d.id}
                      className="p-3.5 flex items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white opacity-60"
                          style={{ backgroundColor: d.color }}
                        >
                          <DisciplineIcon name={d.icon} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                              {d.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              Archived
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Historical time: {Math.round(lifetimeMins / 60)}h {lifetimeMins % 60}m
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onArchiveDiscipline(d.id, false)}
                          className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => onDeleteDiscipline(d.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                          title="Permanently remove from roster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

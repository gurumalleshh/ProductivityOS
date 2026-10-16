import React, { useState } from 'react';
import { ViewTab, UserSettings } from '../types';
import { formatMinutes } from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Calendar,
  Layers,
  Settings,
  CalendarRange,
  CalendarCheck2,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Flame,
  ChevronLeft,
  ChevronRight,
  Command,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  todayStatus: string;
  currentStreak: number;
  settings: UserSettings;
  onOpenAddDiscipline: () => void;
  onOpenQuickLog?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  todayStatus,
  currentStreak,
  settings,
  onOpenAddDiscipline,
  onOpenQuickLog,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Core navigation items specified in Product Design guidelines
  const coreNav = [
    { id: 'dashboard' as ViewTab, label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
    { id: 'tracker' as ViewTab, label: 'Daily Tracker', icon: CalendarDays, shortcut: '2' },
    { id: 'analytics' as ViewTab, label: 'Analytics', icon: BarChart3, shortcut: '3' },
    { id: 'history' as ViewTab, label: 'Productivity History', icon: Calendar, badge: 'Heatmap' },
    { id: 'activities' as ViewTab, label: 'Activity Management', icon: Layers, badge: `${settings.disciplines.filter(d => !d.isArchived).length}` },
    { id: 'settings' as ViewTab, label: 'Settings', icon: Settings },
  ];

  // Time horizon views
  const timeNav = [
    { id: 'weekly' as ViewTab, label: 'Weekly Trends', icon: CalendarRange },
    { id: 'monthly' as ViewTab, label: 'Monthly Pace', icon: CalendarCheck2 },
    { id: 'yearly' as ViewTab, label: 'Yearly Review', icon: Calendar },
  ];

  // System & Architecture documentation views
  const systemNav = [
    { id: 'sheetsPlan' as ViewTab, label: '13-Sheet System Spec', icon: FileSpreadsheet, badge: 'Specs' },
    { id: 'readme' as ViewTab, label: 'README & Protocol', icon: BookOpen },
  ];

  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false && !d.isArchived);
  const dailyTotalTarget = activeDisciplines
    .filter((d) => d.cadence === 'daily')
    .reduce((acc, d) => acc + d.targetMinutes, 0);

  return (
    <aside
      className={`bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out select-none z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between px-3.5">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-xs tracking-tight">
              OS
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-xs tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
                ProductivityOS
              </h1>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono leading-none mt-0.5 truncate">
                Personal Workstation
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-xs">
              OS
            </div>
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={`p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
            isCollapsed ? 'hidden' : 'block'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Pulse / Streak Card */}
      {!isCollapsed ? (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Daily Pulse</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                todayStatus === 'COMPLETED'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200'
                  : todayStatus === 'GOOD'
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200'
                  : todayStatus === 'PARTIAL'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200'
              }`}
            >
              {todayStatus}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Streak
            </span>
            <span className="font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-3 border-b border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand Sidebar"
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div
            title={`Current streak: ${currentStreak} days (${todayStatus})`}
            className="mt-2 flex flex-col items-center"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">
              {currentStreak}d
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 px-2.5 py-3 space-y-5 overflow-y-auto overflow-x-hidden">
        {/* Core Command Views */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Core Navigation
            </div>
          )}
          <nav className="space-y-0.5">
            {coreNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5'
                  } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-neutral-800 dark:bg-neutral-200 text-neutral-200 dark:text-neutral-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Time Horizons */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Time Analysis
            </div>
          )}
          <nav className="space-y-0.5">
            {timeNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-1.5'
                  } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Activity Disciplines */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Disciplines ({activeDisciplines.length})
              </span>
              <button
                type="button"
                onClick={onOpenAddDiscipline}
                title="Add New Activity"
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          )}

          <nav className="space-y-0.5">
            {activeDisciplines.map((d) => {
              const isActive = currentTab === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onSelectTab(d.id)}
                  title={isCollapsed ? `${d.name} (${formatMinutes(d.targetMinutes)})` : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5'
                  } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded-xs flex items-center justify-center shrink-0"
                      style={{ color: isActive ? (settings.theme === 'dark' ? '#171717' : '#FFFFFF') : d.color }}
                    >
                      <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                    </div>
                    {!isCollapsed && <span className="truncate">{d.name}</span>}
                  </div>

                  {!isCollapsed && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono whitespace-nowrap leading-none ${
                        d.cadence === 'weekly'
                          ? isActive
                            ? 'bg-indigo-800 dark:bg-indigo-200 text-indigo-200 dark:text-indigo-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : isActive
                          ? 'text-neutral-300 dark:text-neutral-700'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {d.cadence === 'weekly' ? 'Wkly' : formatMinutes(d.targetMinutes)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System & Protocols */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              System Specs
            </div>
          )}
          <nav className="space-y-0.5">
            {systemNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5'
                  } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Benchmark & Shortcuts */}
      <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/80 text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-col gap-1.5">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Daily Target:</span>
              <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                {formatMinutes(dailyTotalTarget)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pt-1 border-t border-neutral-200/50 dark:border-neutral-800">
              <span className="flex items-center gap-1">
                <Command className="w-2.5 h-2.5" />
                <span>Ctrl+N</span>
              </span>
              <span>Quick Log</span>
            </div>
          </>
        ) : (
          <div className="flex justify-center text-[10px] font-mono text-neutral-400" title={`Daily Target: ${formatMinutes(dailyTotalTarget)}`}>
            {formatMinutes(dailyTotalTarget)}
          </div>
        )}
      </div>
    </aside>
  );
};

import React from 'react';
import { ViewTab, UserSettings } from '../types';
import { formatMinutes } from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  CalendarCheck2,
  Calendar,
  Settings,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  todayStatus: string;
  currentStreak: number;
  settings: UserSettings;
  onOpenAddDiscipline: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  todayStatus,
  currentStreak,
  settings,
  onOpenAddDiscipline,
}) => {
  const mainNav = [
    { id: 'dashboard' as ViewTab, label: 'Dashboard', icon: LayoutDashboard, badge: 'Main' },
    { id: 'tracker' as ViewTab, label: 'Daily Tracker', icon: CalendarDays, badge: 'Master' },
  ];

  const timeAnalytics = [
    { id: 'weekly' as ViewTab, label: 'Weekly Analytics', icon: CalendarRange },
    { id: 'monthly' as ViewTab, label: 'Monthly Analytics', icon: CalendarCheck2 },
    { id: 'yearly' as ViewTab, label: 'Yearly Review', icon: Calendar },
  ];

  const systemNav = [
    { id: 'sheetsPlan' as ViewTab, label: 'Google Sheets Specs', icon: FileSpreadsheet, badge: '13 Sheets' },
    { id: 'settings' as ViewTab, label: 'System Settings', icon: Settings },
    { id: 'readme' as ViewTab, label: 'README & Protocol', icon: BookOpen },
  ];

  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false);
  const dailyTotalTarget = activeDisciplines
    .filter((d) => d.cadence === 'daily')
    .reduce((acc, d) => acc + d.targetMinutes, 0);

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-semibold text-sm shadow-xs">
            OS
          </div>
          <div>
            <h1 className="font-semibold text-sm text-neutral-900 tracking-tight leading-none">
              Productivity OS
            </h1>
            <p className="text-[11px] text-neutral-500 font-mono mt-1">
              Google Sheets System
            </p>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          v2.5
        </div>
      </div>

      {/* Quick Status Pill */}
      <div className="mx-4 mt-4 p-3 rounded-lg bg-neutral-50 border border-neutral-200/70">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-medium">Today's Pulse</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            todayStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
            todayStatus === 'GOOD' ? 'bg-blue-100 text-blue-800' :
            todayStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
            'bg-rose-100 text-rose-800'
          }`}>
            {todayStatus}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-neutral-200/50">
          <span className="text-neutral-500 font-medium">80%+ Streak</span>
          <span className="font-mono font-semibold text-neutral-800">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'} 🔥
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6">
        {/* Core Views */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Core Command
          </div>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600'
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

        {/* Time Horizon */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Time Horizons
          </div>
          <nav className="space-y-1">
            {timeAnalytics.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic Activity Disciplines */}
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Disciplines
            </span>
            <button
              type="button"
              onClick={onOpenAddDiscipline}
              title="Add Activity Discipline"
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <nav className="space-y-1">
            {activeDisciplines.length === 0 ? (
              <button
                type="button"
                onClick={onOpenAddDiscipline}
                className="w-full p-2.5 rounded-lg border border-dashed border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-neutral-500 hover:text-indigo-700 text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add First Discipline</span>
              </button>
            ) : (
              activeDisciplines.map((d) => {
                const isActive = currentTab === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelectTab(d.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-4 h-4 rounded-xs flex items-center justify-center shrink-0"
                        style={{ color: isActive ? '#FFFFFF' : d.color }}
                      >
                        <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{d.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap leading-none ${
                          d.cadence === 'weekly'
                            ? isActive
                              ? 'bg-indigo-800 text-indigo-200'
                              : 'bg-indigo-50 text-indigo-700'
                            : isActive
                            ? 'text-neutral-300'
                            : 'text-neutral-500'
                        }`}
                      >
                        {d.cadence === 'weekly' ? 'Wkly' : formatMinutes(d.targetMinutes)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* System & Architecture */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Architecture
          </div>
          <nav className="space-y-1">
            {systemNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono leading-none whitespace-nowrap">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/70 text-[11px] text-neutral-500 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Target Benchmark:</span>
          <span className="font-mono font-semibold text-neutral-800">
            {formatMinutes(dailyTotalTarget)} / day
          </span>
        </div>
        <div className="text-[10px] text-neutral-400">
          {activeDisciplines.length} configured disciplines
        </div>
      </div>
    </aside>
  );
};


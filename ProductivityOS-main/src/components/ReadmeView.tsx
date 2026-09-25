import React from 'react';
import {
  Shield,
  Clock,
  Sparkles,
  Flame,
  Plus,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  Settings as SettingsIcon,
} from 'lucide-react';
import { UserSettings, ActivityDiscipline } from '../types';
import { DEFAULT_SETTINGS, formatMinutes } from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';

interface ReadmeViewProps {
  settings?: UserSettings;
  onOpenAddDiscipline?: () => void;
  onSelectDiscipline?: (id: string) => void;
}

export const ReadmeView: React.FC<ReadmeViewProps> = ({
  settings: propSettings,
  onOpenAddDiscipline,
  onSelectDiscipline,
}) => {
  const currentSettings: UserSettings = propSettings || DEFAULT_SETTINGS;
  const allDisciplines: ActivityDiscipline[] = currentSettings.disciplines || [];

  const dailyDisciplines = allDisciplines.filter(
    (d: ActivityDiscipline) => d.isActive !== false && (d.cadence === 'daily' || !d.cadence)
  );
  const weeklyDisciplines = allDisciplines.filter(
    (d: ActivityDiscipline) => d.isActive !== false && d.cadence === 'weekly'
  );

  const totalDailyMinutes = dailyDisciplines.reduce((acc: number, d: ActivityDiscipline) => acc + (d.targetMinutes || 0), 0);
  const totalWeeklyMinutes = weeklyDisciplines.reduce((acc: number, d: ActivityDiscipline) => acc + (d.targetMinutes || 0), 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Title */}
      <div className="border-b border-neutral-200/80 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
          Sheet 01 • Architecture & Philosophy
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          YOUR PERSONAL PRODUCTIVITY OPERATING SYSTEM
        </h1>
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          A lifelong, data-driven personal operating system architected to compound depth, technical mastery, and discipline over decades. Fully dynamic with zero hardcoded constraints.
        </p>
      </div>

      {/* 1. System Philosophy */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>1. System Philosophy & Purpose</span>
        </h2>
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 text-xs text-neutral-700 leading-relaxed space-y-2.5">
          <p>
            Most habit trackers fail because they either record binary checkmarks (which hide depth of work) or suffer from spreadsheet decay (needing new tabs every month or year).
          </p>
          <p>
            The <strong>Personal Productivity OS</strong> operates on four foundational pillars:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-[11px] text-neutral-600">
            <li><strong>Single Lifetime Repository:</strong> No separate monthly or yearly sheets. All days live in one master table designed to scale to 10,000+ rows effortlessly.</li>
            <li><strong>Decoupled Presentation & Logic:</strong> Calculations occur automatically, leaving the user interface calm, readable, and free of visual formula noise.</li>
            <li><strong>Dynamic User-Configured Disciplines:</strong> Zero hardcoded targets. Whenever you add, edit, or adjust activities, your baseline benchmark and analytics auto-generate across the system.</li>
            <li><strong>Balanced Scoring Engine:</strong> Excessive hours in one activity cannot artificially mask 0 hours in another. Credit is capped at 100% per category for overall adherence scoring.</li>
          </ul>
        </div>
      </section>

      {/* 2. Dynamic Baseline Activities (Auto-Generated from User Disciplines) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                2. Configured Activity Disciplines{' '}
                <span className="font-mono text-emerald-700 font-bold">
                  ({formatMinutes(totalDailyMinutes)} Daily Standard)
                </span>
              </span>
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Auto-generated based on your active disciplines. Adding or modifying activities instantly recalculates your baseline.
            </p>
          </div>

          {onOpenAddDiscipline && (
            <button
              type="button"
              onClick={onOpenAddDiscipline}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Activity Discipline</span>
            </button>
          )}
        </div>

        {dailyDisciplines.length === 0 && weeklyDisciplines.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-neutral-300 rounded-xl">
            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-neutral-800">No activity disciplines configured</div>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Add your first activity discipline above to auto-generate your personal daily benchmark.
            </p>
            {onOpenAddDiscipline && (
              <button
                type="button"
                onClick={onOpenAddDiscipline}
                className="mt-3 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Activity</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Daily Disciplines Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {dailyDisciplines.map((d: ActivityDiscipline, index: number) => (
                <div
                  key={d.id}
                  onClick={() => onSelectDiscipline?.(d.id)}
                  className={`p-3.5 rounded-xl bg-white border border-neutral-200/90 shadow-2xs transition-all flex flex-col justify-between ${
                    onSelectDiscipline ? 'hover:border-indigo-300 hover:shadow-xs cursor-pointer group' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: d.color || '#4F46E5' }}
                        >
                          <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono text-[11px] text-neutral-400 font-semibold shrink-0">
                          {index + 1}.
                        </span>
                        <div className="font-semibold text-neutral-900 truncate" title={d.name}>
                          {d.name}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 whitespace-nowrap leading-none shrink-0">
                        Daily
                      </span>
                    </div>

                    <div className="font-mono font-bold text-sm" style={{ color: d.color || '#4F46E5' }}>
                      {formatMinutes(d.targetMinutes)} ({d.targetMinutes}m)
                    </div>

                    <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-tight">
                      {d.tagline || `${d.category || 'General'} discipline`}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span className="truncate">{d.category || 'Discipline'}</span>
                    {onSelectDiscipline && (
                      <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 whitespace-nowrap">
                        Analytics <ArrowUpRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Total Daily Benchmark Card */}
              <div className="p-4 rounded-xl bg-neutral-900 text-white flex flex-col justify-between shadow-xs border border-neutral-800">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                    Total Daily Benchmark
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    {formatMinutes(totalDailyMinutes)}
                  </div>
                  <div className="text-xs text-neutral-300 font-mono mt-0.5">
                    ({totalDailyMinutes} minutes standard / day)
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>{dailyDisciplines.length} Daily Disciplines</span>
                  <span className="text-emerald-400 font-semibold">100% Target</span>
                </div>
              </div>
            </div>

            {/* Weekly Special Activities Subsection (If any configured) */}
            {weeklyDisciplines.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide font-mono">
                      Weekly Special Activities (Once per week cadence)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 leading-none whitespace-nowrap">
                    {weeklyDisciplines.length} Weekly Activity{weeklyDisciplines.length > 1 ? 'ies' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {weeklyDisciplines.map((d: ActivityDiscipline) => (
                    <div
                      key={d.id}
                      onClick={() => onSelectDiscipline?.(d.id)}
                      className={`p-3 rounded-lg bg-white border border-indigo-100 flex items-center justify-between gap-3 shadow-2xs ${
                        onSelectDiscipline ? 'hover:border-indigo-300 cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: d.color || '#6366F1' }}
                        >
                          <DisciplineIcon name={d.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-neutral-900 truncate" title={d.name}>
                            {d.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {d.tagline || '1 session required per ISO calendar week'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-indigo-700 whitespace-nowrap">
                          {formatMinutes(d.targetMinutes)}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 whitespace-nowrap">
                          1x / week
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* 3. Balanced Scoring Formula */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>3. Balanced Scoring Methodology</span>
        </h2>
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 text-xs text-neutral-700 space-y-2.5">
          <p>
            In traditional spreadsheets, if you do 4 hours of physical training and 0 minutes of coding or development, a naive average would say <code>(240/60 + 0/60) / 2 = 200%</code>. That is deceptive and undermines true multi-domain consistency.
          </p>

          <div className="p-3.5 rounded-lg bg-neutral-900 text-neutral-200 font-mono text-[11px] overflow-x-auto space-y-1">
            <div className="text-neutral-400 text-[10px] uppercase tracking-wider">Master Formula:</div>
            <div className="text-emerald-400 font-semibold whitespace-nowrap">
              Overall Daily % = (∑ MIN(ActivityActual_i, ActivityTarget_i)) / TotalDailyTarget
            </div>
            {dailyDisciplines.length > 0 && (
              <div className="text-neutral-300 text-[10px] pt-1 border-t border-neutral-800 whitespace-nowrap">
                Your Formula: ({dailyDisciplines.map((d: ActivityDiscipline) => `MIN(${d.name.split(' ')[0]}Act, ${formatMinutes(d.targetMinutes)})`).join(' + ')}) / {formatMinutes(totalDailyMinutes)}
              </div>
            )}
          </div>

          <p>
            This guarantees that each category contributes strictly up to its allocated target towards your 100% daily standard. Extra hours in one activity compound your lifetime hours and personal records, but never falsify adherence.
          </p>
        </div>
      </section>

      {/* 4. Streaks Engine */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-600 shrink-0" />
          <span>4. Streak Engine Specification</span>
        </h2>
        <div className="p-4 rounded-xl bg-white border border-neutral-200/90 text-xs text-neutral-700 space-y-3">
          <p>
            A day qualifies for your streak if its balanced completion reaches at least <strong>80%</strong>. This accounts for unavoidable real-world schedule fluctuations while maintaining an executive standard of discipline.
          </p>

          {/* Status Qualifier Boxes with generous padding and clean character allotment */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-center text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex flex-col items-center justify-center min-h-[64px]">
              <div className="font-bold text-sm whitespace-nowrap">100%+</div>
              <div className="text-[11px] font-semibold whitespace-nowrap mt-0.5">COMPLETED</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex flex-col items-center justify-center min-h-[64px]">
              <div className="font-bold text-sm whitespace-nowrap">80% – 99%</div>
              <div className="text-[11px] font-semibold whitespace-nowrap mt-0.5">GOOD (Streak Met)</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex flex-col items-center justify-center min-h-[64px]">
              <div className="font-bold text-sm whitespace-nowrap">50% – 79%</div>
              <div className="text-[11px] font-semibold whitespace-nowrap mt-0.5">PARTIAL</div>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 flex flex-col items-center justify-center min-h-[64px]">
              <div className="font-bold text-sm whitespace-nowrap">&lt; 50%</div>
              <div className="text-[11px] font-semibold whitespace-nowrap mt-0.5">LOW</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

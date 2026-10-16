import React, { useState, useMemo } from 'react';
import { DailyRecord, UserSettings, HeatmapDayData } from '../types';
import {
  generateYearlyHeatmapData,
  formatMinutes,
  getTodayISO,
} from '../data/productivityStore';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Info,
} from 'lucide-react';

interface ProductivityHeatmapProps {
  records: DailyRecord[];
  settings: UserSettings;
  onSelectDate: (date: string, record?: DailyRecord) => void;
  initialYear?: number;
}

export const ProductivityHeatmap: React.FC<ProductivityHeatmapProps> = ({
  records,
  settings,
  onSelectDate,
  initialYear,
}) => {
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear || currentCalendarYear
  );

  // Derive available years from records, always including current and adjacent years
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([currentCalendarYear, currentCalendarYear - 1]);
    records.forEach((r) => {
      if (r.year) yearSet.add(r.year);
      else if (r.date) {
        const y = parseInt(r.date.split('-')[0], 10);
        if (!isNaN(y)) yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [records, currentCalendarYear]);

  // Generate heatmap grid and stats
  const heatmapData = useMemo(() => {
    return generateYearlyHeatmapData(selectedYear, records, settings);
  }, [selectedYear, records, settings]);

  const [hoveredDay, setHoveredDay] = useState<HeatmapDayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const weekdayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const getSquareColorClass = (day: HeatmapDayData | null) => {
    if (!day) return 'bg-transparent';
    if (day.isFuture) {
      return 'bg-neutral-100/60 dark:bg-neutral-800/40 border border-dashed border-neutral-200/50 dark:border-neutral-700/40 cursor-default';
    }
    switch (day.level) {
      case 1:
        return 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 border border-emerald-200/60 dark:border-emerald-800/60 cursor-pointer';
      case 2:
        return 'bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-800/70 dark:hover:bg-emerald-700 border border-emerald-300/60 dark:border-emerald-700/60 cursor-pointer';
      case 3:
        return 'bg-emerald-400 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-emerald-500/60 cursor-pointer text-white';
      case 4:
        return 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 border border-emerald-600 cursor-pointer text-white shadow-2xs';
      case 5:
        return 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-400 dark:hover:bg-emerald-300 border border-emerald-700 dark:border-emerald-300 cursor-pointer text-white shadow-xs';
      case 0:
      default:
        return 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 border border-neutral-200/50 dark:border-neutral-700/50 cursor-pointer';
    }
  };

  const handleMouseEnter = (day: HeatmapDayData, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setTooltipPos(null);
  };

  const handleClickDay = (day: HeatmapDayData) => {
    const matchedRecord = records.find((r) => r.date === day.date);
    onSelectDate(day.date, matchedRecord);
  };

  const todayStr = getTodayISO();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs space-y-6">
      {/* Header and Year Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Productivity Activity Heatmap
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
              {selectedYear}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            GitHub-style contribution calendar of your daily focus, discipline consistency, and target achievement.
          </p>
        </div>

        {/* Year Selector Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 p-0.5 text-xs font-mono">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent px-2 py-1 font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-hidden"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  {yr}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Total Time</span>
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {formatMinutes(heatmapData.totalMinutes)}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">In {selectedYear}</div>
        </div>

        <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Days</span>
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {heatmapData.activeDays}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Days with sessions</div>
        </div>

        <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Target Achieved</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {heatmapData.targetMetDays}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">100% daily standard</div>
        </div>

        <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Daily Average</span>
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {formatMinutes(heatmapData.avgMinutesPerActiveDay)}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Per active day</div>
        </div>

        <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Current Streak</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {heatmapData.consistencyStreak.current}d
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
            {heatmapData.consistencyStreak.isActiveToday ? 'Achieved today' : heatmapData.consistencyStreak.isMaintained ? 'Maintained (yesterday)' : 'Ready for today'}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-purple-500" />
            <span>Longest Streak</span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
            {heatmapData.longestStreak}d
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Consecutive standard</div>
        </div>
      </div>

      {/* Main Heatmap Grid with Horizontal Scrolling Container */}
      <div className="overflow-x-auto pb-2 pt-1">
        <div className="inline-block min-w-full">
          {/* Month Header Labels */}
          <div className="flex text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mb-1.5 pl-8 select-none">
            {heatmapData.monthHeaders.map((m, idx) => (
              <div
                key={`${m.name}-${idx}`}
                className="truncate"
                style={{
                  width: `${(53 / 12) * 16}px`,
                  minWidth: '32px',
                }}
              >
                {m.name}
              </div>
            ))}
          </div>

          {/* Weekday Labels + Grid */}
          <div className="flex gap-2">
            {/* Weekday names on the left */}
            <div className="flex flex-col justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500 h-[110px] select-none pr-1">
              {weekdayLabels.map((label, idx) => (
                <div key={idx} className="h-3 flex items-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[3.5px]">
              {heatmapData.weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3.5px]">
                  {week.map((day, dayIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${weekIdx}-${dayIdx}`}
                          className="w-3 h-3 rounded-[2.5px] bg-transparent"
                        />
                      );
                    }

                    const isCurrentDay = day.date === todayStr;

                    return (
                      <div
                        key={day.date}
                        onClick={() => handleClickDay(day)}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                        className={`w-3 h-3 rounded-[2.5px] transition-all duration-75 relative ${getSquareColorClass(
                          day
                        )} ${isCurrentDay ? 'ring-1.5 ring-neutral-900 dark:ring-white ring-offset-1' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Legend & Prompt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-[11px]">
          <Info className="w-3.5 h-3.5 text-neutral-400" />
          <span>Click any square to view, log, or edit productivity for that day.</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50" title="No activity" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200" title="< 25%" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 dark:bg-emerald-800/70 border border-emerald-300" title="25% - 50%" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-600" title="50% - 75%" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" title="75% - 100%" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 dark:bg-emerald-400" title=">= 100% (Target Achieved)" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && tooltipPos && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-neutral-900 dark:bg-neutral-800 text-white p-3 rounded-lg shadow-xl text-xs max-w-xs w-64 border border-neutral-700 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="flex items-center justify-between border-b border-neutral-700/80 pb-1.5 mb-2 font-mono">
            <span className="font-semibold text-neutral-200">{hoveredDay.date}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              hoveredDay.overallPct >= 100
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : hoveredDay.overallPct >= 80
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : hoveredDay.totalActual > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-neutral-400'
            }`}>
              {hoveredDay.totalActual > 0 ? `${hoveredDay.overallPct}%` : 'No logs'}
            </span>
          </div>

          <div className="space-y-1 text-neutral-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Tracked:</span>
              <span className="font-mono font-semibold text-white">
                {hoveredDay.totalActual > 0 ? formatMinutes(hoveredDay.totalActual) : '0m'}
              </span>
            </div>
            {hoveredDay.totalTarget > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-400">Daily Target:</span>
                <span className="font-mono text-neutral-300">
                  {formatMinutes(hoveredDay.totalTarget)}
                </span>
              </div>
            )}
          </div>

          {/* Activities breakdown */}
          {hoveredDay.activities.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-neutral-700/80 space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Disciplines Completed:
              </div>
              {hoveredDay.activities.map((act) => (
                <div key={act.id} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: act.color }}
                    />
                    <span className="truncate text-neutral-200">{act.name}</span>
                  </div>
                  <span className="font-mono text-neutral-300 shrink-0">
                    {formatMinutes(act.minutes)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {hoveredDay.isFuture && (
            <div className="mt-1 text-[10px] text-neutral-400 italic">
              Future date
            </div>
          )}
        </div>
      )}
    </div>
  );
};

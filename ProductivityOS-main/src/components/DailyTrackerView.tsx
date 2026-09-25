import React, { useState } from 'react';
import { DailyRecord, UserSettings } from '../types';
import { formatMinutes } from '../data/productivityStore';
import { DisciplineIcon } from './DisciplineIcon';
import {
  Download,
  Filter,
  Plus,
  Search,
  FileSpreadsheet,
  Edit2,
  Calendar,
  Sun,
  Layers,
  Trash2,
} from 'lucide-react';
import { exportDailyTrackerCSV } from '../services/sheetsExportService';
import { ConfirmModal } from './ConfirmModal';

interface DailyTrackerViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  onOpenLogModal: (date?: string, existing?: DailyRecord) => void;
  onOpenAddDiscipline?: () => void;
  onDeleteRecord?: (id: string) => void;
}

export const DailyTrackerView: React.FC<DailyTrackerViewProps> = ({
  records,
  settings,
  onOpenLogModal,
  onOpenAddDiscipline,
  onDeleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [recordToDelete, setRecordToDelete] = useState<DailyRecord | null>(null);

  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false);

  // Unique months for filter
  const months = Array.from(new Set(records.map((r) => r.month))).sort().reverse();

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (selectedMonth !== 'ALL' && r.month !== selectedMonth) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDate = r.date.toLowerCase().includes(q);
      const matchDay = r.day.toLowerCase().includes(q);
      const matchNotes = (r.notes || '').toLowerCase().includes(q);
      if (!matchDate && !matchDay && !matchNotes) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const csvContent = exportDailyTrackerCSV(records, settings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Productivity_OS_Master_Daily_Tracker_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              DAILY TRACKER • MASTER DATABASE
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Sheet 03
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            The single source of truth. Every row tracks your daily logs and weekly special activities against active disciplines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onOpenAddDiscipline && (
            <button
              onClick={onOpenAddDiscipline}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Discipline</span>
            </button>
          )}

          <button
            onClick={() => onOpenLogModal()}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Daily Entry</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by date, day, or reflection notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Filter */}
          {months.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 text-xs border border-neutral-200 rounded-lg bg-white text-neutral-700 font-mono"
            >
              <option value="ALL">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Status Chips */}
          {(['ALL', 'COMPLETED', 'GOOD', 'PARTIAL', 'LOW'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Spreadsheet Input Legend */}
      <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-mono px-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-neutral-100 border border-neutral-300" />
          <span>Calculated Formulas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-200/80 border border-slate-400" />
          <span className="font-semibold text-neutral-700">Editable Actual Cells (Click to Edit)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono whitespace-nowrap leading-none">
            Weekly 1x
          </span>
          <span>Weekly Special Activity</span>
        </div>
      </div>

      {/* Master Interactive Spreadsheet Table */}
      <div className="bg-white border border-neutral-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-neutral-900 text-neutral-200 font-mono sticky top-0 z-20 shadow-xs">
              <tr className="border-b border-neutral-800 text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap sticky left-0 bg-neutral-900 z-30">
                  Date
                </th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Day</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Wk</th>

                {/* Dynamic Discipline Columns */}
                {activeDisciplines.map((d) => (
                  <th
                    key={d.id}
                    colSpan={d.cadence === 'daily' ? 3 : 2}
                    className="py-2.5 px-2 text-center border-l border-neutral-800 font-semibold"
                    style={{ borderTop: `2px solid ${d.color}` }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <DisciplineIcon name={d.icon} className="w-3 h-3 shrink-0" style={{ color: d.color }} />
                      <span className="truncate max-w-[120px]" title={d.name}>
                        {d.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono leading-none whitespace-nowrap shrink-0 ${
                          d.cadence === 'weekly'
                            ? 'bg-indigo-900 text-indigo-200'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {d.cadence === 'weekly' ? 'Wkly' : 'Daily'}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Overall Totals */}
                <th className="py-2.5 px-2 text-center border-l border-neutral-800">Total Tgt</th>
                <th className="py-2.5 px-2 text-center font-bold">Total Act</th>
                <th className="py-2.5 px-2.5 text-center font-bold text-white bg-neutral-800">
                  Overall %
                </th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 min-w-[180px]">Notes</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>

              {/* Sub-header row for Actual / Target */}
              {activeDisciplines.length > 0 && (
                <tr className="border-b border-neutral-800 text-[10px] bg-neutral-950 text-neutral-400">
                  <th className="py-1 px-3 sticky left-0 bg-neutral-950 z-30"></th>
                  <th className="py-1 px-2.5"></th>
                  <th className="py-1 px-2"></th>

                  {activeDisciplines.map((d) => (
                    <React.Fragment key={`sub-${d.id}`}>
                      <th className="py-1 px-1.5 text-center border-l border-neutral-800">Tgt</th>
                      <th className="py-1 px-1.5 text-center bg-neutral-900 text-neutral-200 font-bold">
                        Act
                      </th>
                      {d.cadence === 'daily' && (
                        <th className="py-1 px-1.5 text-center text-neutral-400">%</th>
                      )}
                    </React.Fragment>
                  ))}

                  <th className="py-1 px-2 text-center border-l border-neutral-800"></th>
                  <th className="py-1 px-2 text-center"></th>
                  <th className="py-1 px-2.5 text-center bg-neutral-900"></th>
                  <th className="py-1 px-3 text-center"></th>
                  <th className="py-1 px-4"></th>
                  <th className="py-1 px-2"></th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-neutral-200/70 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      3 +
                      activeDisciplines.reduce(
                        (acc, d) => acc + (d.cadence === 'daily' ? 3 : 2),
                        0
                      ) +
                      6
                    }
                    className="py-16 px-4 text-center"
                  >
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-800 font-sans">
                        No Daily Records Found
                      </h4>
                      <p className="text-xs text-neutral-500 font-sans mt-1 mb-4">
                        {records.length === 0
                          ? 'All demo data has been cleared. Add your activity disciplines and start logging your daily performance.'
                          : 'No records match your active search or month filters.'}
                      </p>
                      <div className="flex items-center gap-2">
                        {onOpenAddDiscipline && (
                          <button
                            onClick={onOpenAddDiscipline}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Discipline</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenLogModal()}
                          className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-semibold font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Log Daily Performance</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-neutral-50/90 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
                    }`}
                  >
                    {/* Date & Week */}
                    <td className="py-2 px-3 whitespace-nowrap font-bold text-neutral-900 sticky left-0 bg-white z-10">
                      {r.date}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap text-neutral-500 font-sans text-[11px]">
                      {r.day}
                    </td>
                    <td className="py-2 px-2 text-neutral-400 text-center">
                      {r.week}
                    </td>

                    {/* Dynamic Discipline Values */}
                    {activeDisciplines.map((d) => {
                      const tgt = r.activityTargets?.[d.id] ?? d.targetMinutes;
                      const act = r.activityActuals?.[d.id] ?? 0;
                      const pct = r.activityPercentages?.[d.id] ?? (tgt > 0 ? Math.round((act / tgt) * 100) : 0);

                      if (d.cadence === 'weekly') {
                        return (
                          <React.Fragment key={`row-${d.id}-${r.id}`}>
                            <td className="py-2 px-2 text-center text-neutral-400 border-l border-neutral-200 font-mono whitespace-nowrap">
                              {formatMinutes(tgt)}
                            </td>
                            <td
                              onClick={() => onOpenLogModal(r.date, r)}
                              className={`py-2 px-2 text-center font-semibold cursor-pointer hover:bg-indigo-100 font-mono whitespace-nowrap ${
                                act > 0
                                  ? 'bg-indigo-50 text-indigo-900 font-bold'
                                  : 'bg-slate-50 text-neutral-400'
                              }`}
                              title="Click to edit"
                            >
                              {act > 0 ? formatMinutes(act) : '—'}
                            </td>
                          </React.Fragment>
                        );
                      }

                      return (
                        <React.Fragment key={`row-${d.id}-${r.id}`}>
                          <td className="py-2 px-2 text-center text-neutral-400 border-l border-neutral-200 font-mono whitespace-nowrap">
                            {formatMinutes(tgt)}
                          </td>
                          <td
                            onClick={() => onOpenLogModal(r.date, r)}
                            className="py-2 px-2 text-center font-semibold bg-slate-100 text-neutral-900 cursor-pointer hover:bg-indigo-100 font-mono whitespace-nowrap"
                            title="Click to edit"
                          >
                            {formatMinutes(act)}
                          </td>
                          <td
                            className={`py-2 px-2 text-center font-semibold border-r border-neutral-200 font-mono whitespace-nowrap ${
                              pct >= 100
                                ? 'text-emerald-600'
                                : pct >= 80
                                ? 'text-blue-600'
                                : 'text-neutral-500'
                            }`}
                          >
                            {pct}%
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Totals */}
                    <td className="py-2 px-2 text-center text-neutral-400 border-l border-neutral-200">
                      {formatMinutes(r.totalTarget)}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-neutral-900">
                      {formatMinutes(r.totalActual)}
                    </td>
                    <td className="py-2 px-2.5 text-center font-bold text-neutral-900 bg-neutral-100/70">
                      {r.overallPct}%
                    </td>

                    {/* Status Pill */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'GOOD'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-2 px-4 font-sans text-[11px] text-neutral-600 truncate max-w-xs">
                      {r.notes || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenLogModal(r.date, r)}
                          title="Edit Log"
                          className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteRecord && (
                          <button
                            onClick={() => setRecordToDelete(r)}
                            title="Delete Log"
                            className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Record Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!recordToDelete}
        title="Delete Daily Log Record"
        message={`Are you sure you want to delete the daily log for ${recordToDelete?.date} (${recordToDelete?.day})?\n\nThis will remove all logged hours for this day from your analytics, streaks, and lifetime totals.`}
        confirmLabel="Delete Log"
        confirmVariant="danger"
        onConfirm={() => {
          if (recordToDelete && onDeleteRecord) {
            onDeleteRecord(recordToDelete.id);
            setRecordToDelete(null);
          }
        }}
        onClose={() => setRecordToDelete(null)}
      />
    </div>
  );
};

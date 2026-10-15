import React, { useState } from 'react';
import { ProductivityBackup, ValidationResult } from '../services/backupRestoreService';
import { Upload, AlertTriangle, CheckCircle, Shield, X, Calendar, Layers, Clock } from 'lucide-react';

interface RestoreModalProps {
  isOpen: boolean;
  validation: ValidationResult | null;
  onConfirm: (backup: ProductivityBackup, mode: 'replace' | 'merge') => void;
  onClose: () => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  validation,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !validation || !validation.data) return null;

  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const summary = validation.summary;
  const backup = validation.data;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 leading-snug">
                Restore Database from Backup
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review verified backup payload before applying
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Verification Badge */}
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Backup file verified and validated. Schema integrity confirmed.
            </span>
          </div>

          {/* Backup Summary Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/70">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1 font-sans font-semibold">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Daily Records</span>
              </div>
              <div className="text-lg font-bold text-neutral-900 mt-1">
                {summary?.recordCount || 0}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
                {summary?.dateRange
                  ? `${summary.dateRange.start} → ${summary.dateRange.end}`
                  : 'No records'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/70">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1 font-sans font-semibold">
                <Layers className="w-3.5 h-3.5 text-neutral-500" />
                <span>Disciplines</span>
              </div>
              <div className="text-lg font-bold text-neutral-900 mt-1">
                {summary?.disciplineCount || 0}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Configured disciplines
              </div>
            </div>
          </div>

          {/* Export Timestamp */}
          {summary?.exportedAt && (
            <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5 px-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Exported at: {new Date(summary.exportedAt).toLocaleString()}</span>
            </div>
          )}

          {/* Restoration Mode Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider block">
              Restore Strategy
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'replace'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="text-xs font-bold text-neutral-900">Replace Current</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Overwrites active database with the exact backup file state.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('merge')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'merge'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="text-xs font-bold text-neutral-900">Merge with Existing</div>
                <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                  Combines backup records and disciplines into your existing data.
                </p>
              </button>
            </div>
          </div>

          {/* Safety Guarantee Callout */}
          <div className="p-3 rounded-xl bg-neutral-100/80 border border-neutral-200/80 text-[11px] text-neutral-600 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-800">Automatic Safety Snapshot:</span>{' '}
              A complete snapshot of your current database will be saved before restoring. You can revert if needed.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(backup, mode)}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-black text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Confirm & Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
};

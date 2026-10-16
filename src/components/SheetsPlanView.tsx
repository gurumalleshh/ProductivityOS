import React, { useState } from 'react';
import { SHEETS_ARCHITECTURE } from '../data/sheetsArchitecture';
import {
  FileSpreadsheet,
  Layers,
  Table,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
} from 'lucide-react';

export const SheetsPlanView: React.FC = () => {
  const [expandedSheet, setExpandedSheet] = useState<string>('02');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const handleCopy = (formula: string, key: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(key);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            GOOGLE SHEETS 13-SHEET ARCHITECTURE SPECIFICATION
          </h1>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Implementation Blueprint
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Complete, production-grade architectural specification for each sheet in the Google Sheets workbook: column layouts, exact formulas, conditional formatting rules, and dynamic chart configurations.
        </p>
      </div>

      {/* 13 Sheets Accordion List */}
      <div className="space-y-3">
        {SHEETS_ARCHITECTURE.map((spec) => {
          const isExpanded = expandedSheet === spec.sheetNumber;
          return (
            <div
              key={spec.sheetNumber}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl shadow-xs overflow-hidden transition-colors"
            >
              {/* Header Toggle */}
              <button
                onClick={() => setExpandedSheet(isExpanded ? '' : spec.sheetNumber)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-mono font-bold text-xs flex items-center justify-center">
                    {spec.sheetNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {spec.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {spec.purpose}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-400">
                    {spec.charts.length > 0 ? `${spec.charts.length} Charts • ` : ''}{spec.headerColumns.length} Columns
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
              </button>

              {/* Expanded Sheet Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-5 animate-in fade-in duration-100">
                  {/* Column Schema Table */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      Column Schema & Format
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/80 font-mono text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                          <tr>
                            <th className="py-2 px-3">Col</th>
                            <th className="py-2 px-3">Column Name</th>
                            <th className="py-2 px-3">Type / Formula</th>
                            <th className="py-2 px-3">Cell Format</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                          {spec.headerColumns.map((c, i) => (
                            <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                              <td className="py-1.5 px-3 font-bold text-neutral-900 dark:text-neutral-100">{c.col}</td>
                              <td className="py-1.5 px-3 text-neutral-800 dark:text-neutral-200">{c.name}</td>
                              <td className="py-1.5 px-3 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">{c.formulaOrType}</td>
                              <td className="py-1.5 px-3 text-neutral-500 dark:text-neutral-400 text-[11px]">{c.format}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Exact Formulas */}
                  {spec.keyFormulas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                        Exact Google Sheets Formulas
                      </h4>
                      <div className="space-y-2">
                        {spec.keyFormulas.map((f, i) => {
                          const copyKey = `${spec.sheetNumber}-${i}`;
                          const isCopied = copiedFormula === copyKey;
                          return (
                            <div key={i} className="p-3 rounded-lg bg-neutral-900 dark:bg-neutral-950 text-white font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-neutral-800">
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-neutral-400 font-sans font-medium uppercase tracking-wider">
                                  {f.label} — {f.description}
                                </div>
                                <div className="text-emerald-400 text-xs overflow-x-auto">
                                  {f.formula}
                                </div>
                              </div>
                              <button
                                onClick={() => handleCopy(f.formula, copyKey)}
                                className="self-end sm:self-auto px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-sans flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{isCopied ? 'Copied' : 'Copy Formula'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Conditional Formatting Rules */}
                  {spec.conditionalFormatting.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Conditional Formatting Specifications
                      </h4>
                      <ul className="list-disc pl-5 text-xs text-neutral-600 dark:text-neutral-400 space-y-1 font-mono">
                        {spec.conditionalFormatting.map((cf, i) => (
                          <li key={i}>{cf}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Charts Blueprint */}
                  {spec.charts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                        Chart Configuration Specs ({spec.charts.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {spec.charts.map((ch, i) => (
                          <div key={i} className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-xs space-y-1.5 font-mono">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 font-sans">{ch.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">{ch.type}</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">{ch.purpose}</div>
                            <div className="pt-1.5 border-t border-neutral-200/60 dark:border-neutral-700/60 text-[10px] text-neutral-600 dark:text-neutral-400 grid grid-cols-2 gap-1">
                              <div>Data Range: <span className="text-neutral-900 dark:text-neutral-200">{ch.dataRange}</span></div>
                              <div>X-Axis: <span className="text-neutral-900 dark:text-neutral-200">{ch.xAxis}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

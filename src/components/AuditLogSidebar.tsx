import React, { useState, useEffect } from 'react';
import { ActivityLogEntry } from '../types/agent';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import {
  FileText,
  GitCompare,
  AlertTriangle,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Download,
  X,
  CheckCircle2,
  XCircle,
  Search,
  Terminal,
} from 'lucide-react';

interface AuditLogSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogSidebar: React.FC<AuditLogSidebarProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'changes' | 'failures' | 'tests'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredLogs = logs.filter((entry) => {
    if (filterMode === 'changes' && entry.whatChanged.length === 0) return false;
    if (filterMode === 'failures' && entry.whatFailed.length === 0 && entry.status !== 'FAIL') return false;
    if (filterMode === 'tests' && entry.testingDone.length === 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = [
        entry.title,
        entry.inputText,
        entry.outputText,
        ...entry.whatFailed,
        ...entry.whatChanged.map((c) => `${c.area} ${c.before} ${c.after}`),
        ...entry.testingDone.map((t) => `${t.testName} ${t.detail}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_check_log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusLabel = (status: ActivityLogEntry['status']) => {
    if (status === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          PASS
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          WARN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-rose-700 dark:text-rose-400">
        <XCircle className="w-3 h-3" />
        FAIL
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-neutral-950/30 dark:bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Activity & Check Log Drawer"
        className="relative w-full max-w-[460px] h-full border-l border-neutral-200/80 dark:border-white/10 bg-white/88 dark:bg-slate-950/88 backdrop-blur-2xl shadow-2xl flex flex-col z-10"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Terminal className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white truncate">
                Activity Log
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono tabular-nums">
                {logs.length} {logs.length === 1 ? 'event' : 'events'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              title="Download Log as JSON"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClearLogs}
              disabled={logs.length === 0}
              title="Clear Log"
              className="p-1.5 text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2.5 bg-neutral-50/60 dark:bg-neutral-900/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved text, diffs, errors, or checks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-lg text-[11px] font-medium">
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'changes' as const, label: 'Changed' },
              { id: 'failures' as const, label: 'Failed' },
              { id: 'tests' as const, label: 'Tests' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`py-1 px-2 rounded-md text-center whitespace-nowrap transition-colors ${
                  filterMode === tab.id
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Log Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <FileText className="w-6 h-6 text-neutral-400 mx-auto" />
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                No matching items
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Build rules, run a check, or test a message to save clear records here.
              </p>
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const isExpanded = expandedIds[entry.id] ?? logs[0]?.id === entry.id;

              return (
                <div key={entry.id} className="p-3.5 space-y-2.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleExpand(entry.id)}
                    className="w-full text-left flex items-start justify-between gap-2 group"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="mt-0.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                          {simplifyAndRedactText(entry.title)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums flex-wrap">
                          <span>{entry.type}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.timestamp}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.whatChanged.length} diffs</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.whatFailed.length} failed</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.testingDone.length} checks</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pt-0.5">{getStatusLabel(entry.status)}</div>
                  </button>

                  {isExpanded && (
                    <div className="pl-5 space-y-3 pt-1">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                          <FileText className="w-3 h-3 text-neutral-500" />
                          <span>Saved Text (Input &amp; Answer)</span>
                        </div>
                        <div className="space-y-1.5 text-[11px] font-mono">
                          <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 max-h-28 overflow-y-auto whitespace-pre-wrap break-words select-text">
                            <span className="text-[10px] font-bold text-neutral-500 block mb-0.5">INPUT:</span>
                            {entry.inputText || '(Empty)'}
                          </div>
                          <div className="p-2 rounded-md bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 max-h-32 overflow-y-auto whitespace-pre-wrap break-words select-text">
                            <span className="text-[10px] font-bold text-neutral-500 block mb-0.5">ANSWER:</span>
                            {simplifyAndRedactText(entry.outputText || '(None)')}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                          <GitCompare className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>What Changed ({entry.whatChanged.length})</span>
                        </div>
                        {entry.whatChanged.length === 0 ? (
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                            No edits in this step.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {entry.whatChanged.map((chg, idx) => (
                              <div key={idx} className="p-2 rounded-md bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 text-[11px] space-y-1">
                                <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  {simplifyAndRedactText(chg.area)}
                                </div>
                                <div className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 line-through line-clamp-2">
                                  {simplifyAndRedactText(chg.before)}
                                </div>
                                <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 line-clamp-3">
                                  → {simplifyAndRedactText(chg.after)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>What Failed / Missing ({entry.whatFailed.length})</span>
                        </div>
                        {entry.whatFailed.length === 0 ? (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            No failures or blocked steps.
                          </div>
                        ) : (
                          <ul className="space-y-1 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-md p-2">
                            {entry.whatFailed.map((fail, idx) => (
                              <li key={idx} className="leading-snug">
                                • {simplifyAndRedactText(fail)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                          <FlaskConical className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Checks Run ({entry.testingDone.length})</span>
                        </div>
                        {entry.testingDone.length === 0 ? (
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                            No checks run yet.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {entry.testingDone.map((t, idx) => (
                              <div key={idx} className="p-2 rounded-md bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 text-[11px] space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                    {simplifyAndRedactText(t.testName)}
                                  </span>
                                  <span
                                    className={`font-mono text-[10px] font-bold ${
                                      t.outcome === 'FAIL'
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : t.outcome === 'WARNING'
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                                  >
                                    {t.outcome}
                                  </span>
                                </div>
                                <div className="text-neutral-600 dark:text-neutral-400 text-[10px] leading-snug">
                                  {simplifyAndRedactText(t.detail)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};

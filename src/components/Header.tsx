import React from 'react';
import { Sparkles, Sun, Moon, Download, History, Terminal, HelpCircle } from 'lucide-react';
import { WorkspaceTab } from '../types/agent';

interface HeaderProps {
  setActiveTab: (tab: WorkspaceTab) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  onOpenExport: () => void;
  onOpenHistory: () => void;
  onOpenIntro: () => void;
  isLogSidebarOpen: boolean;
  onToggleLogSidebar: () => void;
  logCount: number;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  hasOptimizedResult: boolean;
  snapshotCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  setActiveTab,
  onOptimize,
  isOptimizing,
  onOpenExport,
  onOpenHistory,
  onOpenIntro,
  isLogSidebarOpen,
  onToggleLogSidebar,
  logCount,
  isDark,
  setIsDark,
  hasOptimizedResult,
  snapshotCount,
}) => {
  return (
    <header className="sticky top-0 z-40 relative border-b border-neutral-200/70 dark:border-white/10 bg-white/75 dark:bg-slate-950/75 backdrop-blur-2xl transition-colors">
      <div className="flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-3.5 relative z-10 max-w-6xl mx-auto">
        {/* Zone 1: Single Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('builder');
          }}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
        >
          Agent Architect
        </a>

        {/* Zone 2 & 3: Quiet Workspace Drawers + 1 Primary Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenIntro}
            title="Open Setup Guide"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-white/75 dark:bg-slate-900/75 border border-neutral-200/80 dark:border-white/10 rounded-xl transition-colors whitespace-nowrap"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {hasOptimizedResult && (
            <button
              type="button"
              onClick={onOpenExport}
              title="Export Rules & Code"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-white/75 dark:bg-slate-900/75 border border-neutral-200/80 dark:border-white/10 rounded-xl transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleLogSidebar}
            title="Open Activity Log"
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-colors whitespace-nowrap ${
              isLogSidebarOpen
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-white/75 dark:bg-slate-900/75 border-neutral-200/80 dark:border-white/10'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden sm:inline">Activity</span>
            <span className="font-mono tabular-nums">{logCount}</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            title="Saved Draft History"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-white/75 dark:bg-slate-900/75 border border-neutral-200/80 dark:border-white/10 rounded-xl transition-colors whitespace-nowrap"
          >
            <History className="w-4 h-4" />
            <span className="font-mono tabular-nums">{snapshotCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            title="Switch Light / Dark Theme"
            className="p-2 text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white rounded-xl hover:bg-neutral-100/80 dark:hover:bg-slate-800/80 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOptimize}
            disabled={isOptimizing}
            className="relative inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm overflow-hidden"
          >
            <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Building...' : 'Build Rules'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

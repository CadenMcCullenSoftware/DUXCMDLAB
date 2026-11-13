import React from 'react';
import { Sparkles, Sun, Moon, Download, History, Terminal } from 'lucide-react';
import { WorkspaceTab } from '../types/agent';

interface HeaderProps {
  setActiveTab: (tab: WorkspaceTab) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  onOpenExport: () => void;
  onOpenHistory: () => void;
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
  isLogSidebarOpen,
  onToggleLogSidebar,
  logCount,
  isDark,
  setIsDark,
  hasOptimizedResult,
  snapshotCount,
}) => {
  return (
    <header className="sticky top-0 z-40 relative border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl transition-colors">
      {/* Subtle Top Chromatic Aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-12 left-1/3 w-96 h-20 bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-cyan-400/20 blur-2xl animate-pulse-glow" />
      </div>

      <div className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3 relative z-10 max-w-5xl mx-auto">
        {/* Zone 1: Single Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('builder');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
        >
          Agent Architect
        </a>

        {/* Zone 2 & 3: Quiet Workspace Drawers + 1 Primary Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {hasOptimizedResult && (
            <button
              type="button"
              onClick={onOpenExport}
              title="Export Rules & Code"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white/70 dark:bg-neutral-800/70 border border-neutral-200/90 dark:border-neutral-700/90 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export File</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleLogSidebar}
            title="Open Activity & Check Log"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isLogSidebarOpen
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white/70 dark:bg-neutral-800/70 border-neutral-200/90 dark:border-neutral-700/90'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Activity</span>
            <span className="font-mono tabular-nums">{logCount}</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            title="Saved Draft History"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white/70 dark:bg-neutral-800/70 border border-neutral-200/90 dark:border-neutral-700/90 rounded-lg transition-colors whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{snapshotCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            title="Switch Light / Dark Theme"
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOptimize}
            disabled={isOptimizing}
            className="relative inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs overflow-hidden"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Building...' : 'Build Rules'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

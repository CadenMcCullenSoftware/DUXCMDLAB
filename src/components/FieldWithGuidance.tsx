import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

interface FieldWithGuidanceProps {
  label: string;
  hint: string;
  whyItMatters: string;
  exampleText: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}

export const FieldWithGuidance: React.FC<FieldWithGuidanceProps> = ({
  label,
  hint,
  whyItMatters,
  exampleText,
  value,
  onChange,
  placeholder,
  rows = 3,
}) => {
  const [showExample, setShowExample] = useState(false);

  const trimmed = value.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  // Lightweight detail-depth indicator so users immediately know expected granularity
  const readiness =
    wordCount === 0
      ? { label: 'Empty', tone: 'text-neutral-400 dark:text-neutral-500' }
      : wordCount < 7
      ? { label: 'Short', tone: 'text-amber-600 dark:text-amber-400' }
      : { label: 'Good detail', tone: 'text-emerald-600 dark:text-emerald-400' };

  return (
    <div className="space-y-1.5">
      {/* Top Row: Clear Label + Depth Readiness + Expandable Why & Example Toggle */}
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
          {label}
        </label>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[11px] font-mono tabular-nums ${readiness.tone}`}>
            {readiness.label} · {wordCount}w
          </span>

          <button
            type="button"
            onClick={() => setShowExample((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors whitespace-nowrap"
          >
            {showExample ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>Example &amp; Why</span>
          </button>
        </div>
      </div>

      {/* Concise 1-Line Prompt Hint */}
      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug">
        {hint}
      </p>

      {/* Expandable Progressive Guidance Drawer */}
      {showExample && (
        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/80 space-y-2 text-xs">
          <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Why this helps: </span>
            {whyItMatters}
          </div>
          <div className="p-2.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {exampleText}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange(exampleText);
                setShowExample(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Use Example</span>
            </button>
          </div>
        </div>
      )}

      {/* Clean Input Textarea */}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-xs font-normal text-neutral-900 dark:text-neutral-100 bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/60 dark:focus:ring-indigo-400/60 transition-all placeholder:text-neutral-400 leading-relaxed"
      />
    </div>
  );
};

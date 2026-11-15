import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

interface FieldWithGuidanceProps {
  label: string;
  hint?: string;
  whyItMatters?: string;
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

  const readiness =
    wordCount === 0
      ? { label: 'Empty', tone: 'text-neutral-400 dark:text-neutral-500' }
      : wordCount < 7
      ? { label: 'Short', tone: 'text-amber-600 dark:text-amber-400' }
      : { label: 'Ready', tone: 'text-emerald-600 dark:text-emerald-400' };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <label className="block text-sm sm:text-base font-bold tracking-tight text-neutral-950 dark:text-white">
            {label}
          </label>
          {hint && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
              {hint}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-0.5">
          <span className={`text-xs font-mono tabular-nums ${readiness.tone}`}>
            {readiness.label} · {wordCount}w
          </span>

          <button
            type="button"
            onClick={() => setShowExample((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors whitespace-nowrap"
          >
            {showExample ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>Example</span>
          </button>
        </div>
      </div>

      {showExample && (
        <div className="p-3.5 rounded-xl bg-neutral-50/90 dark:bg-slate-800/70 border border-neutral-200/80 dark:border-white/10 space-y-2.5 text-xs sm:text-sm">
          {whyItMatters && (
            <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <span className="font-semibold text-neutral-900 dark:text-white">Why it matters: </span>
              {whyItMatters}
            </div>
          )}
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-white/10 font-mono text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
            {exampleText}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange(exampleText);
                setShowExample(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 dark:text-white bg-neutral-100 dark:bg-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Use Example</span>
            </button>
          </div>
        </div>
      )}

      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm font-normal text-neutral-950 dark:text-neutral-50 bg-white/80 dark:bg-slate-950/60 border border-neutral-200/90 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/40 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500 leading-relaxed"
      />
    </div>
  );
};

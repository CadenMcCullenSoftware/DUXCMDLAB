import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface SecondaryAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface StepHandoffBarProps {
  stepLabel: string;
  completedSummary: string;
  isStepComplete?: boolean;
  backLabel?: string;
  onBack?: () => void;
  secondaryAction?: SecondaryAction;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  isPrimaryLoading?: boolean;
  primaryIcon?: 'arrow' | 'sparkles';
}

export const StepHandoffBar: React.FC<StepHandoffBarProps> = ({
  stepLabel,
  completedSummary,
  isStepComplete = false,
  backLabel,
  onBack,
  secondaryAction,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  isPrimaryLoading = false,
  primaryIcon = 'arrow',
}) => {
  return (
    <div className="mt-8 pt-5 border-t border-neutral-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <CheckCircle2
          className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${
            isStepComplete
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-400 dark:text-neutral-500'
          }`}
        />
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
            {stepLabel}
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mt-0.5">
            {completedSummary}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap shrink-0 justify-end">
        {onBack && backLabel && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white border border-neutral-200/90 dark:border-white/15 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-100 bg-white/80 dark:bg-slate-800/80 border border-neutral-300/80 dark:border-white/15 rounded-xl hover:border-neutral-400 dark:hover:border-white/30 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <span>{secondaryAction.label}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || isPrimaryLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {primaryIcon === 'sparkles' && (
            <Sparkles className={`w-4 h-4 ${isPrimaryLoading ? 'animate-spin' : ''}`} />
          )}
          <span>{primaryLabel}</span>
          {primaryIcon === 'arrow' && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

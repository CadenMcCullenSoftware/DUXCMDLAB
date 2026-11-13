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
    <div className="mt-8 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Practical Step Status Summary */}
      <div className="flex items-start gap-2.5 min-w-0">
        <CheckCircle2
          className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
            isStepComplete
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-400 dark:text-neutral-500'
          }`}
        />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            {stepLabel}
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug mt-0.5">
            {completedSummary}
          </p>
        </div>
      </div>

      {/* Right: Clean Back / Secondary / Next Step Action Cluster */}
      <div className="flex items-center gap-2.5 flex-wrap shrink-0 justify-end">
        {onBack && backLabel && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <span>{secondaryAction.label}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || isPrimaryLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {primaryIcon === 'sparkles' && (
            <Sparkles className={`w-3.5 h-3.5 ${isPrimaryLoading ? 'animate-spin' : ''}`} />
          )}
          <span>{primaryLabel}</span>
          {primaryIcon === 'arrow' && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

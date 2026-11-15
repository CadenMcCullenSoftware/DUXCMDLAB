import React, { useState } from 'react';
import {
  STEP_COMPLIANCE_SPECS,
  AI_COMMAND_OPERATIONS_CATALOG,
} from '../data/stepRequirements';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import { WorkspaceTab } from '../types/agent';
import {
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Sparkles,
} from 'lucide-react';

interface StepCompliancePanelProps {
  step: WorkspaceTab;
  satisfiedIds?: string[];
  actionButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  defaultExpanded?: boolean;
}

export const StepCompliancePanel: React.FC<StepCompliancePanelProps> = ({
  step,
  satisfiedIds = [],
  actionButton,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const spec = STEP_COMPLIANCE_SPECS[step];
  const satisfiedCount = spec.items.filter((item) => satisfiedIds.includes(item.id)).length;
  const allSatisfied = satisfiedCount === spec.items.length;

  return (
    <div className="depth-strip rounded-2xl overflow-hidden transition-all">
      {/* Compact Single-Line Rule Bar */}
      <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-3 text-left min-w-0 flex-1 group"
        >
          <ShieldCheck
            className={`w-4 h-4 shrink-0 ${
              allSatisfied
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-indigo-600 dark:text-indigo-400'
            }`}
          />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm min-w-0 flex-1">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {simplifyAndRedactText(spec.heading)}
            </span>
            <span aria-hidden="true" className="text-neutral-400">·</span>
            <span className="font-mono text-xs tabular-nums text-neutral-600 dark:text-neutral-300">
              {satisfiedCount}/{spec.items.length} met
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white shrink-0">
            <span>{isExpanded ? 'Hide' : 'Rules'}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        </button>

        {actionButton && !allSatisfied && (
          <button
            type="button"
            onClick={actionButton.onClick}
            disabled={actionButton.disabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shrink-0 whitespace-nowrap disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{actionButton.label}</span>
          </button>
        )}
      </div>

      {/* Expandable Detailed Rules & AI Command List */}
      {isExpanded && (
        <div className="border-t border-neutral-200/80 dark:border-white/10 px-5 py-4 space-y-4 bg-white/50 dark:bg-slate-950/35">
          <div className="divide-y divide-neutral-200/80 dark:divide-white/10 border border-neutral-200/90 dark:border-white/10 rounded-xl bg-white/80 dark:bg-slate-900/75 overflow-hidden">
            {spec.items.map((item, idx) => {
              const isMet = satisfiedIds.includes(item.id);
              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <span className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">
                        0{idx + 1}.
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {simplifyAndRedactText(item.title)}
                      </span>
                      <span aria-hidden="true" className="text-neutral-400">·</span>
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                        {item.commandOp}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {simplifyAndRedactText(item.requirement)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono font-semibold ${
                        isMet
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {isMet ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {isMet ? 'PASS' : 'WAIT'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
              <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Commands (One Pass · No Loops)</span>
              </span>
            </div>

            <div className="overflow-x-auto border border-neutral-200/90 dark:border-white/10 rounded-xl bg-white/80 dark:bg-slate-900/75">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
                    <th className="py-2.5 px-3 font-semibold">Command</th>
                    <th className="py-2.5 px-3 font-semibold">Access</th>
                    <th className="py-2.5 px-3 font-semibold">What It Does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/70 dark:divide-white/5">
                  {AI_COMMAND_OPERATIONS_CATALOG.map((op) => (
                    <tr key={op.command}>
                      <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {op.command}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {op.scope}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">
                        {simplifyAndRedactText(op.purpose)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

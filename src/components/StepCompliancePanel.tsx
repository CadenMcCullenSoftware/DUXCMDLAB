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
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md overflow-hidden">
      {/* Compact Single-Line Rule Summary Row */}
      <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-start sm:items-center gap-2.5 text-left min-w-0 flex-1 group"
        >
          <ShieldCheck
            className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
              allSatisfied
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-indigo-600 dark:text-indigo-400'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {simplifyAndRedactText(spec.heading)}
              </span>
              <span aria-hidden="true" className="text-neutral-400">·</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-600 dark:text-neutral-400">
                {satisfiedCount}/{spec.items.length} met
              </span>
              <span aria-hidden="true" className="text-neutral-400">·</span>
              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                {spec.antiLoopRule}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              {simplifyAndRedactText(spec.summaryLine)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white shrink-0">
            <span>{isExpanded ? 'Hide' : 'Notes'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </button>

        {actionButton && !allSatisfied && (
          <button
            type="button"
            onClick={actionButton.onClick}
            disabled={actionButton.disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shrink-0 whitespace-nowrap disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            <span>{actionButton.label}</span>
          </button>
        )}
      </div>

      {/* Expandable Plain Notes & AI Command List */}
      {isExpanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-4 space-y-4 bg-neutral-50/60 dark:bg-neutral-950/40">
          <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden">
            {spec.items.map((item, idx) => {
              const isMet = satisfiedIds.includes(item.id);
              return (
                <div key={item.id} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-mono text-[11px] font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">
                        0{idx + 1}.
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {simplifyAndRedactText(item.title)}
                      </span>
                      <span aria-hidden="true" className="text-neutral-400">·</span>
                      <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                        {item.commandOp}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {simplifyAndRedactText(item.requirement)}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      {simplifyAndRedactText(item.annotation)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${
                        isMet
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {isMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {isMet ? 'PASS' : 'WAIT'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Allowed AI Commands Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Command List (One Pass Only · Loop Limit = 0)</span>
              </span>
            </div>

            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                    <th className="py-2 px-3 font-semibold">Command</th>
                    <th className="py-2 px-3 font-semibold">Access</th>
                    <th className="py-2 px-3 font-semibold">Loop Rule</th>
                    <th className="py-2 px-3 font-semibold">What It Does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
                  {AI_COMMAND_OPERATIONS_CATALOG.map((op) => (
                    <tr key={op.command}>
                      <td className="py-2 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {op.command}
                      </td>
                      <td className="py-2 px-3 font-mono text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {op.scope}
                      </td>
                      <td className="py-2 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {op.loopPolicy}
                      </td>
                      <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
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

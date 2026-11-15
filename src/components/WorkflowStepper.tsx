import React from 'react';
import { motion } from 'motion/react';
import { Check, AlertCircle } from 'lucide-react';
import { WorkspaceTab, WorkflowCompletionStatus } from '../types/agent';

interface WorkflowStepperProps {
  activeStep: WorkspaceTab;
  onSelectStep: (step: WorkspaceTab) => void;
  completion: WorkflowCompletionStatus;
}

interface StepDescriptor {
  id: WorkspaceTab;
  num: string;
  label: string;
}

const STEPS: StepDescriptor[] = [
  { id: 'builder', num: '01', label: 'Configure Rules' },
  { id: 'review', num: '02', label: 'Compiled Output' },
  { id: 'audit', num: '03', label: 'Compliance Audit' },
  { id: 'simulator', num: '04', label: 'Test Live' },
  { id: 'swarmex', num: '05', label: 'Final Gates' },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  activeStep,
  onSelectStep,
  completion,
}) => {
  const getStepState = (id: WorkspaceTab): 'completed' | 'attention' | 'active' | 'upcoming' => {
    const isActive = activeStep === id;
    if (id === 'review' && completion.needsReoptimize) {
      return isActive ? 'active' : 'attention';
    }
    if (isActive) return 'active';

    switch (id) {
      case 'builder':
        return completion.isConfigured ? 'completed' : 'upcoming';
      case 'review':
        return completion.isOptimized ? 'completed' : 'upcoming';
      case 'audit':
        return completion.isAudited ? 'completed' : 'upcoming';
      case 'simulator':
        return completion.probesExecuted > 0 ? 'completed' : 'upcoming';
      case 'swarmex':
        return completion.swarmexChecksCompleted > 0 ? 'completed' : 'upcoming';
      default:
        return 'upcoming';
    }
  };

  return (
    <div className="relative border-b border-neutral-200/70 dark:border-white/10 bg-white/55 dark:bg-slate-950/55 backdrop-blur-xl z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <nav
          aria-label="Workflow Steps"
          className="relative flex items-center justify-between gap-2 overflow-x-auto no-scrollbar"
        >
          {STEPS.map((step, index) => {
            const state = getStepState(step.id);
            const isActive = activeStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  className={`relative group flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition-colors shrink-0 ${
                    isActive
                      ? 'text-neutral-950 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="workflowStepperActiveBg"
                      className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-neutral-200/90 dark:border-white/15 shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    >
                      <div className="absolute inset-x-4 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                    </motion.div>
                  )}

                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold tabular-nums shrink-0 transition-colors ${
                      state === 'completed'
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-neutral-950'
                        : state === 'attention'
                        ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-neutral-950'
                        : isActive
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950'
                        : 'bg-neutral-200/80 text-neutral-700 dark:bg-slate-800 dark:text-neutral-300'
                    }`}
                  >
                    {state === 'completed' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : state === 'attention' ? (
                      <AlertCircle className="w-3.5 h-3.5" />
                    ) : (
                      step.num
                    )}
                  </span>

                  <span className="text-xs sm:text-sm font-semibold whitespace-nowrap leading-tight">
                    {step.label}
                  </span>
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden sm:block flex-1 min-w-[12px] max-w-[40px] h-[1px] bg-neutral-300/70 dark:bg-white/10"
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

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
  shortHint: string;
}

const STEPS: StepDescriptor[] = [
  {
    id: 'builder',
    num: '01',
    label: 'Setup',
    shortHint: 'Write goals & limits',
  },
  {
    id: 'review',
    num: '02',
    label: 'Compare',
    shortHint: 'Check 4 helper steps',
  },
  {
    id: 'audit',
    num: '03',
    label: 'Check',
    shortHint: 'Check safety & plain words',
  },
  {
    id: 'simulator',
    num: '04',
    label: 'Test Live',
    shortHint: 'Trace SP-01 -> SP-04 turns',
  },
  {
    id: 'swarmex',
    num: '05',
    label: 'Final Gates',
    shortHint: 'Test locks & math gate',
  },
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
    <div className="relative border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-lg z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5">
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
                  className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors shrink-0 ${
                    isActive
                      ? 'text-neutral-950 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="workflowStepperActiveBg"
                      className="absolute inset-0 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    >
                      <div className="absolute inset-x-3 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                    </motion.div>
                  )}

                  {/* Step Index Circle */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold tabular-nums shrink-0 transition-colors ${
                      state === 'completed'
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-neutral-950'
                        : state === 'attention'
                        ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-neutral-950'
                        : isActive
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950'
                        : 'bg-neutral-200/80 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
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

                  <div className="min-w-0">
                    <div className="text-xs font-semibold whitespace-nowrap leading-tight">
                      {step.label}
                    </div>
                    <div className="hidden lg:block text-[10px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap leading-tight mt-0.5">
                      {state === 'attention' ? 'Draft changed · Re-build' : step.shortHint}
                    </div>
                  </div>
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden sm:block flex-1 min-w-[12px] max-w-[36px] h-[1px] bg-neutral-200 dark:bg-neutral-800"
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

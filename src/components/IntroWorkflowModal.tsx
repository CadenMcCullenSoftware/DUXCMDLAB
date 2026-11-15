import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Compass,
  ShieldCheck,
  Cpu,
  Layers,
  MessageSquareCode,
  Rocket,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { WorkspaceTab } from '../types/agent';

export type IntroBuilderSection = 'role' | 'arch' | 'domain' | 'persona';

interface IntroTopicItem {
  field: string;
  action: string;
}

interface IntroStep {
  id: string;
  badge: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  targetTab: WorkspaceTab;
  targetSection?: IntroBuilderSection;
  jumpLabel: string;
  items: IntroTopicItem[];
}

const INTRO_STEPS: IntroStep[] = [
  {
    id: 'overview',
    badge: 'What · Why · How',
    title: 'How Agent Architect Works',
    icon: Compass,
    targetTab: 'builder',
    targetSection: 'role',
    jumpLabel: 'Open Step 1 Setup',
    items: [
      {
        field: 'What This App Does',
        action: 'Converts your rough goals, boundaries, and output schema into one strict, testable system prompt and TechnicalResponsePayload contract.',
      },
      {
        field: 'Why You Need It',
        action: 'Unchecked prompts guess, loop endlessly, chat instead of returning JSON, or infer personal opinions. These gates stop every one of those failures.',
      },
      {
        field: 'How the Final Output Functions',
        action: 'Every prompt runs through 4 sequential checkpoints (SP-01 Scope → SP-02 No-Loop & Refusal → SP-03 Math & URL Proof → SP-04 Clean Output) inside TypeScript, Python, or Markdown exports.',
      },
    ],
  },
  {
    id: 'role',
    badge: '1.1 Purpose',
    title: '1.1 Purpose & Goal Inputs',
    icon: ShieldCheck,
    targetTab: 'builder',
    targetSection: 'role',
    jumpLabel: 'Open 1.1 Goal',
    items: [
      {
        field: 'Main Goal',
        action: 'Locks the core job into SP-01 so later steps cannot drift off topic.',
      },
      {
        field: 'Daily Tasks',
        action: 'Defines the ordered workflow executed on each request.',
      },
      {
        field: 'Final Output',
        action: 'Sets the exact deliverable shape (TechnicalResponsePayload JSON, Markdown report, or SQL).',
      },
      {
        field: 'Pass Criteria',
        action: 'Provides concrete pass rules checked during Step 3 Audit.',
      },
    ],
  },
  {
    id: 'arch',
    badge: '1.2 Safety',
    title: '1.2 Safety & Limits Inputs',
    icon: Cpu,
    targetTab: 'builder',
    targetSection: 'arch',
    jumpLabel: 'Open 1.2 Limits',
    items: [
      {
        field: 'Safe Limits & Never Do Rules',
        action: 'Blocks auto-fix retry loops (max_auto_adjust_loops = 0), personal profiling, and unapproved writes.',
      },
      {
        field: 'Allowed AI Commands',
        action: 'Restricts actions to safe one-pass commands like cmd:triage_resource, cmd:verify_claim, and cmd:escalate_human_gate.',
      },
      {
        field: 'Step Order',
        action: 'Enforces fixed checkpoint order: SP-01 → SP-02 → SP-03 → SP-04.',
      },
      {
        field: 'Stop Rules for Bad Input',
        action: 'Tells the agent to halt cleanly on broken JSON, wrong math, or loop prompts instead of guessing.',
      },
    ],
  },
  {
    id: 'domain',
    badge: '1.3 Facts',
    title: '1.3 Facts & Source Rules',
    icon: Layers,
    targetTab: 'builder',
    targetSection: 'domain',
    jumpLabel: 'Open 1.3 Facts',
    items: [
      {
        field: 'Checking Methods',
        action: 'Enables direct arithmetic verification and strict syntax validation.',
      },
      {
        field: 'Trusted Guides & Files',
        action: 'Pins outputs to approved schemas and configuration files.',
      },
      {
        field: 'Public Web URL Rules',
        action: 'Permits only publicly verifiable https:// sources and blocks intent modeling.',
      },
      {
        field: 'Proof Tags',
        action: 'Separates proven runs (Verified) from unread code clues (Supported Inference).',
      },
    ],
  },
  {
    id: 'persona',
    badge: '1.4 Output',
    title: '1.4 Voice & Schema Format',
    icon: MessageSquareCode,
    targetTab: 'builder',
    targetSection: 'persona',
    jumpLabel: 'Open 1.4 Format',
    items: [
      {
        field: 'Direct Tone',
        action: 'Removes conversational chit-chat and unrequested explanatory preamble.',
      },
      {
        field: 'TechnicalResponsePayload Keys',
        action: 'Enforces exact JSON keys ("context", "explicit requirements", "response_data") with no arbitrary synonyms.',
      },
      {
        field: 'Banned Phrases',
        action: 'Strips speculative guesses like "maybe" or "I think" before delivery.',
      },
      {
        field: 'Output Template',
        action: 'Defines the exact JSON or Markdown layout your downstream app receives.',
      },
    ],
  },
  {
    id: 'testing',
    badge: 'Steps 2–5',
    title: 'Compile, Audit, Test Live & Export',
    icon: Rocket,
    targetTab: 'simulator',
    jumpLabel: 'Open Step 4 Live Test',
    items: [
      {
        field: 'Step 2 & Step 3 (Compare & Audit)',
        action: 'Inspect your compiled SP-01 → SP-04 pipeline side by side and run the 0–100 compliance audit.',
      },
      {
        field: 'Step 4 (Test Live)',
        action: 'Validate real TechnicalResponsePayload JSON output, profiling refusal, loop blocking, and web URL checks.',
      },
      {
        field: 'Step 5 & Export SDK',
        action: 'Verify read-only file bounds, (y/N) human approval gates, and copy ready-to-run TypeScript, Python, or JSON.',
      },
    ],
  },
];

interface IntroWorkflowModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
  onJumpToLocation: (tab: WorkspaceTab, section?: IntroBuilderSection) => void;
  onLoadStarterPreset?: () => void;
  hasExistingInputs: boolean;
}

export const IntroWorkflowModal: React.FC<IntroWorkflowModalProps> = ({
  isOpen,
  onClose,
  onJumpToLocation,
  onLoadStarterPreset,
  hasExistingInputs,
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [dontShowOnStartup, setDontShowOnStartup] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(dontShowOnStartup);
      } else if (e.key === 'ArrowRight') {
        setStepIndex((prev) => Math.min(INTRO_STEPS.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowOnStartup, onClose]);

  if (!isOpen) return null;

  const currentStep = INTRO_STEPS[stepIndex];
  const Icon = currentStep.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === INTRO_STEPS.length - 1;

  const handleJump = () => {
    onClose(dontShowOnStartup);
    onJumpToLocation(currentStep.targetTab, currentStep.targetSection);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/55 backdrop-blur-md"
      onClick={() => onClose(dontShowOnStartup)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-workflow-title"
        onClick={(e) => e.stopPropagation()}
        className="depth-block rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/15 dark:bg-indigo-400/15 text-indigo-700 dark:text-indigo-300 shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {stepIndex + 1}/{INTRO_STEPS.length} · {currentStep.badge}
              </div>
              <h2
                id="intro-workflow-title"
                className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white truncate"
              >
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose(dontShowOnStartup)}
            title="Close (Esc)"
            className="p-2 text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white rounded-xl hover:bg-neutral-100/80 dark:hover:bg-slate-800/80 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2.5 border-b border-neutral-200/70 dark:border-white/10 bg-neutral-50/60 dark:bg-slate-900/45 flex items-center gap-1.5 overflow-x-auto">
          {INTRO_STEPS.map((step, idx) => {
            const active = idx === stepIndex;
            const visited = idx < stepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setStepIndex(idx)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-xs'
                    : visited
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
                }`}
              >
                {visited && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{step.badge}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentStep.items.map((item) => (
              <div
                key={item.field}
                className="rounded-2xl p-4 bg-white/75 dark:bg-slate-900/70 border border-neutral-200/80 dark:border-white/10 space-y-1.5"
              >
                <div className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
                  {item.field}
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
                  {item.action}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-slate-900/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowOnStartup}
              onChange={(e) => setDontShowOnStartup(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-neutral-900 focus:ring-indigo-500"
            />
            <span>Skip on start</span>
          </label>

          <div className="flex items-center flex-wrap gap-2 justify-end">
            {isFirst && !hasExistingInputs && onLoadStarterPreset && (
              <button
                type="button"
                onClick={() => {
                  onLoadStarterPreset();
                  onClose(dontShowOnStartup);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-300/60 dark:border-indigo-500/30 rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Starter</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleJump}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-100 bg-white/80 dark:bg-slate-800/80 border border-neutral-300/80 dark:border-white/15 rounded-xl hover:border-neutral-400 transition-colors"
            >
              {currentStep.jumpLabel}
            </button>

            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-slate-800/80 border border-neutral-200/80 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                onClick={() => setStepIndex((prev) => Math.min(INTRO_STEPS.length - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose(dontShowOnStartup);
                  onJumpToLocation('builder', 'role');
                }}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
              >
                <span>Start</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

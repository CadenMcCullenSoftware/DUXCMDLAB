import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

interface SystemBlueprintBannerProps {
  defaultOpen?: boolean;
  onJumpToAudit?: () => void;
  onJumpToSimulator?: () => void;
}

export const SystemBlueprintBanner: React.FC<SystemBlueprintBannerProps> = ({
  defaultOpen = false,
  onJumpToAudit,
  onJumpToSimulator,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <section className="depth-strip rounded-2xl overflow-hidden transition-all">
      <div className="px-5 py-3.5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-3 text-left min-w-0 flex-1 group"
        >
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm min-w-0">
            <span className="font-semibold text-neutral-950 dark:text-white">
              How It Works
            </span>
            <span aria-hidden="true" className="text-neutral-400">·</span>
            <span className="text-neutral-600 dark:text-neutral-300 truncate">
              Turns your rules into a checked system instruction + JSON schema pipeline
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 shrink-0 whitespace-nowrap">
            <span>{isOpen ? 'Hide Guide' : 'What · Why · How Output Runs'}</span>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-neutral-200/80 dark:border-white/10 px-5 py-5 bg-white/55 dark:bg-slate-950/40 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                <span>01</span>
                <span aria-hidden="true">/</span>
                <span>What This App Does</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
                Compiles Loose Notes Into Exact Rules
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Takes your 4 inputs (Goal, Limits, Facts, Format) and compiles them into one strict system instruction plus a testable JSON contract so an AI behaves predictably every turn.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                <span>02</span>
                <span aria-hidden="true">/</span>
                <span>Why Every Gate Exists</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
                Stops Hallucinations, Loops &amp; Profiling
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Standard prompts drift or chat endlessly. These gates block infinite self-editing loops, refuse personal profiling, check math equations directly, and require real public https:// sources.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                <span>03</span>
                <span aria-hidden="true">/</span>
                <span>How Final Output Functions</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
                4 Sequential Checkpoints Into Production Code
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Your exported rule set runs every prompt through SP-01 (Scope) → SP-02 (Limits) → SP-03 (Proof &amp; URLs) → SP-04 (Clean JSON Schema or Gate), ready to copy into TypeScript, Python, or Markdown.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-700 dark:text-neutral-300">
              <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                Runtime Chain:
              </span>
              <span>SP-01 Scope Filter</span>
              <span aria-hidden="true" className="text-neutral-400">→</span>
              <span>SP-02 No-Loop &amp; Refusal</span>
              <span aria-hidden="true" className="text-neutral-400">→</span>
              <span>SP-03 Math &amp; URL Proof</span>
              <span aria-hidden="true" className="text-neutral-400">→</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                SP-04 Verified Output
              </span>
            </div>

            {(onJumpToAudit || onJumpToSimulator) && (
              <div className="flex items-center gap-3 shrink-0">
                {onJumpToAudit && (
                  <button
                    type="button"
                    onClick={onJumpToAudit}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    <span>Step 3 Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onJumpToSimulator && (
                  <button
                    type="button"
                    onClick={onJumpToSimulator}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors whitespace-nowrap"
                  >
                    <span>Test Live Output</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

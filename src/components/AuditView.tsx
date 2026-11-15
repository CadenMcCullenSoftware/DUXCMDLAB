import React, { useState, useEffect } from 'react';
import { IndependentAuditReport, WorkspaceTab } from '../types/agent';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import { StepHandoffBar } from './StepHandoffBar';
import { StepCompliancePanel } from './StepCompliancePanel';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  SearchCheck,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface AuditViewProps {
  currentSystemInstruction: string;
  auditReport: IndependentAuditReport | null;
  onAuditPrompt: (text: string) => Promise<IndependentAuditReport | null>;
  onNavigateToTab: (tab: WorkspaceTab) => void;
  onTriggerOptimization: () => void;
  isOptimizing: boolean;
}

export const AuditView: React.FC<AuditViewProps> = ({
  currentSystemInstruction,
  auditReport,
  onAuditPrompt,
  onNavigateToTab,
  onTriggerOptimization,
  isOptimizing,
}) => {
  const [promptToAudit, setPromptToAudit] = useState<string>(currentSystemInstruction || '');
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState<boolean>(false);

  useEffect(() => {
    if (currentSystemInstruction && (!promptToAudit || promptToAudit.trim().length === 0)) {
      setPromptToAudit(currentSystemInstruction);
    }
  }, [currentSystemInstruction]);

  const handleRunAudit = async () => {
    const target = promptToAudit.trim() ? promptToAudit : currentSystemInstruction;
    if (!target.trim()) return;
    setIsRunningAudit(true);
    setErrorMessage(null);
    try {
      const report = await onAuditPrompt(target);
      if (report) {
        setShowPromptEditor(false);
      }
    } catch (err: any) {
      setErrorMessage(simplifyAndRedactText(err.message || 'Check run failed'));
    } finally {
      setIsRunningAudit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="text-amber-700 dark:text-amber-400 font-mono text-xs font-semibold inline-flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            WARN
          </span>
        );
      default:
        return (
          <span className="text-rose-700 dark:text-rose-400 font-mono text-xs font-semibold inline-flex items-center gap-1">
            <ShieldAlert className="w-4 h-4" />
            STOP
          </span>
        );
    }
  };

  const passCount = auditReport?.evaluations.filter((e) => e.status === 'PASS').length ?? 0;
  const totalEvalCount = auditReport?.evaluations.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Focused Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">
            Step 3 of 5 · Compliance Audit
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Audit Rules, Schema &amp; Safety
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
            Checks your compiled system instruction for loop-blocking rules, personal profiling refusal, exact JSON Schema keys, and verifiable URLs before you test live.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPromptEditor((prev) => !prev)}
            className="depth-strip inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-xl hover:border-neutral-400 transition-colors"
          >
            {showPromptEditor ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>{showPromptEditor ? 'Hide Rules' : 'Edit Rules'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isRunningAudit || !(promptToAudit.trim() || currentSystemInstruction.trim())}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            <SearchCheck className={`w-4 h-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
            <span>{isRunningAudit ? 'Checking...' : auditReport ? 'Check Again' : 'Run Check'}</span>
          </button>
        </div>
      </div>

      {/* Collapsed Step 3 Rule Bar */}
      <StepCompliancePanel
        step="audit"
        satisfiedIds={
          auditReport
            ? [
                ...(auditReport.evaluations.some(
                  (e) => /no-loop|anti-loop|command/i.test(e.dimension) && e.status === 'PASS'
                )
                  ? ['req-3-1']
                  : []),
                ...(auditReport.evaluations.some(
                  (e) => /proof|evidence|evidentiary|math/i.test(e.dimension) && e.status === 'PASS'
                )
                  ? ['req-3-2']
                  : []),
                ...(auditReport.overallHealthScore >= 75 ? ['req-3-3'] : []),
              ]
            : []
        }
      />

      {/* Collapsible Rules Editor */}
      {showPromptEditor && (
        <div className="depth-block rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-neutral-950 dark:text-white">
              Rules Text
            </span>
            <div className="flex items-center gap-3">
              {currentSystemInstruction && promptToAudit !== currentSystemInstruction && (
                <button
                  type="button"
                  onClick={() => setPromptToAudit(currentSystemInstruction)}
                  className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Load Step 2 Rules
                </button>
              )}
              <span className="text-neutral-500 font-mono tabular-nums text-xs">
                {promptToAudit.length} chars
              </span>
            </div>
          </div>

          <textarea
            rows={5}
            value={promptToAudit}
            onChange={(e) => setPromptToAudit(e.target.value)}
            placeholder="Paste or load your Step 2 rules..."
            className="w-full px-4 py-3 text-sm font-mono text-neutral-950 dark:text-neutral-50 bg-white/75 dark:bg-slate-950/60 border border-neutral-200 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          {errorMessage && (
            <div className="p-3.5 text-sm text-rose-700 dark:text-rose-300 bg-rose-50/90 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {/* Results Stage */}
      {auditReport ? (
        <div className="space-y-5">
          <div className="depth-strip grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl">
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Compliance Readiness</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white mt-1">
                {auditReport.overallHealthScore} / 100
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Combined score across all 5 safety &amp; schema checks.
              </p>
            </div>

            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Conversational Fluff</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white mt-1">
                {auditReport.fluffRatioPercentage}%
                <span className="ml-2 text-xs font-sans font-normal text-neutral-500">Target &lt;5%</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Detects unrequested filler or speculative phrasing.
              </p>
            </div>

            <div className="flex flex-col sm:items-end justify-center gap-1.5">
              <button
                type="button"
                onClick={onTriggerOptimization}
                disabled={isOptimizing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-white/80 dark:bg-slate-800 border border-neutral-200 dark:border-white/15 hover:border-neutral-400 rounded-xl transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>{isOptimizing ? 'Rebuilding...' : 'Rebuild & Fix Gaps'}</span>
              </button>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Runs one clean compiler pass over Step 1 rules.
              </span>
            </div>
          </div>

          <div className="depth-block rounded-3xl overflow-hidden divide-y divide-neutral-200/80 dark:divide-white/10">
            {auditReport.evaluations.map((item, idx) => (
              <div key={idx} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
                      {simplifyAndRedactText(item.dimension)}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {simplifyAndRedactText(item.finding)}
                  </p>
                  {item.status !== 'PASS' && (
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-200">Next fix: </span>
                      {simplifyAndRedactText(item.recommendation)}
                    </p>
                  )}
                </div>

                <div className="shrink-0 font-mono text-sm sm:text-base font-bold tabular-nums text-neutral-950 dark:text-white">
                  {item.score} / 100
                </div>
              </div>
            ))}
          </div>

          {auditReport.identifiedDeficiencies.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 bg-amber-50/75 dark:bg-amber-950/25 text-sm space-y-2 backdrop-blur-lg">
              <div className="font-bold text-amber-900 dark:text-amber-300">
                Gaps Flagged ({auditReport.identifiedDeficiencies.length})
              </div>
              <ul className="space-y-1 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                {auditReport.identifiedDeficiencies.map((def, i) => (
                  <li key={i}>• {simplifyAndRedactText(def)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="depth-block text-center py-12 rounded-3xl p-8 space-y-3">
          <SearchCheck className="w-8 h-8 text-indigo-500 mx-auto" />
          <div className="space-y-1 max-w-lg mx-auto">
            <h2 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white">
              Ready to Audit Active Rules
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Click Run Check to score SP-01 → SP-04 sequencing, no-loop protection, personal profiling refusal, and TechnicalResponsePayload schema keys.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isRunningAudit || !(promptToAudit.trim() || currentSystemInstruction.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              <SearchCheck className={`w-4 h-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
              <span>{isRunningAudit ? 'Checking...' : 'Run Audit Check'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Handoff Bar */}
      <div className="depth-block rounded-3xl px-6 sm:px-8 pb-6">
        <StepHandoffBar
          stepLabel={auditReport ? 'Step 3 Complete' : 'Step 3 Check'}
          completedSummary={
            auditReport
              ? `Score ${auditReport.overallHealthScore}/100 · ${passCount} of ${totalEvalCount} passed.`
              : 'Run the check above or continue to live testing.'
          }
          isStepComplete={Boolean(auditReport)}
          backLabel="Back to Step 2"
          onBack={() => onNavigateToTab('review')}
          secondaryAction={
            !auditReport
              ? {
                  label: isRunningAudit ? 'Checking...' : 'Run Check',
                  onClick: handleRunAudit,
                  disabled: isRunningAudit || !(promptToAudit.trim() || currentSystemInstruction.trim()),
                }
              : undefined
          }
          primaryLabel="Next: Step 4 Test Live"
          onPrimary={() => onNavigateToTab('simulator')}
        />
      </div>
    </div>
  );
};

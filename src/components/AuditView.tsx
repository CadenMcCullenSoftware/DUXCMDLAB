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
  const [showPromptEditor, setShowPromptEditor] = useState<boolean>(!auditReport);

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
          <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-semibold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="text-amber-700 dark:text-amber-400 font-mono text-[11px] font-semibold inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            WARN
          </span>
        );
      default:
        return (
          <span className="text-rose-700 dark:text-rose-400 font-mono text-[11px] font-semibold inline-flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            STOP
          </span>
        );
    }
  };

  const passCount = auditReport?.evaluations.filter((e) => e.status === 'PASS').length ?? 0;
  const totalEvalCount = auditReport?.evaluations.length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Focused Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            Step 3 of 5 · Check Rules
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-0.5">
            Check Safety Rules &amp; Plain Words
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Check your rules for no-loop locks, safety limits, zero extra fluff, and simple 5th-grade words.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPromptEditor((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 transition-colors"
          >
            {showPromptEditor ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>{showPromptEditor ? 'Hide Rules Text' : 'Edit Rules Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isRunningAudit || !(promptToAudit.trim() || currentSystemInstruction.trim())}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            <SearchCheck className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
            <span>{isRunningAudit ? 'Checking...' : auditReport ? 'Run Check Again' : 'Run Rule Check'}</span>
          </button>
        </div>
      </div>

      {/* Step 3 Compliance Checks */}
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

      {/* Collapsible Input Editor */}
      {showPromptEditor && (
        <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Rules Text Being Checked
            </span>
            <div className="flex items-center gap-3">
              {currentSystemInstruction && promptToAudit !== currentSystemInstruction && (
                <button
                  type="button"
                  onClick={() => setPromptToAudit(currentSystemInstruction)}
                  className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Load Latest from Step 2
                </button>
              )}
              <span className="text-neutral-500 font-mono tabular-nums text-[11px]">
                {promptToAudit.length} chars
              </span>
            </div>
          </div>

          <textarea
            rows={5}
            value={promptToAudit}
            onChange={(e) => setPromptToAudit(e.target.value)}
            placeholder="Paste or load your Step 2 rules here..."
            className="w-full px-3.5 py-2.5 text-xs font-mono text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
          />

          {errorMessage && (
            <div className="p-3 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {/* Check Results Stage */}
      {auditReport ? (
        <div className="space-y-5">
          {/* Compact Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md">
            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Safety Score</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                {auditReport.overallHealthScore} / 100
              </div>
            </div>

            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Extra Fluff</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                {auditReport.fluffRatioPercentage}%
                <span className="ml-2 text-[11px] font-sans font-normal text-neutral-500">Goal &lt;5%</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end">
              <button
                type="button"
                onClick={onTriggerOptimization}
                disabled={isOptimizing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isOptimizing ? 'Fixing...' : 'Fix Missing Parts'}</span>
              </button>
            </div>
          </div>

          {/* Check Rows */}
          <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
            {auditReport.evaluations.map((item, idx) => (
              <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {simplifyAndRedactText(item.dimension)}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {simplifyAndRedactText(item.finding)}
                  </p>
                  {item.status !== 'PASS' && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">Next fix: </span>
                      {simplifyAndRedactText(item.recommendation)}
                    </p>
                  )}
                </div>

                <div className="shrink-0 font-mono text-xs font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {item.score} / 100
                </div>
              </div>
            ))}
          </div>

          {/* Missing Parts Summary */}
          {auditReport.identifiedDeficiencies.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1.5">
              <div className="font-semibold text-amber-900 dark:text-amber-300">
                Missing Parts ({auditReport.identifiedDeficiencies.length})
              </div>
              <ul className="space-y-1 text-neutral-700 dark:text-neutral-300">
                {auditReport.identifiedDeficiencies.map((def, i) => (
                  <li key={i}>• {simplifyAndRedactText(def)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/70 dark:bg-neutral-900/70 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-8 space-y-3">
          <SearchCheck className="w-7 h-7 text-neutral-400 mx-auto" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Ready to Check Your Rules
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Click Run Rule Check to score safety limits, no-loop rules, and simple 5th-grade language before live testing.
          </p>
        </div>
      )}

      {/* Handoff Bar */}
      <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 pb-6">
        <StepHandoffBar
          stepLabel={auditReport ? 'Step 3 Check Done' : 'Step 3 Check Waiting'}
          completedSummary={
            auditReport
              ? `Score ${auditReport.overallHealthScore}/100 · ${passCount} of ${totalEvalCount} rule checks passed.`
              : 'Run the check above, or go straight to Step 4 to test live messages.'
          }
          isStepComplete={Boolean(auditReport)}
          backLabel="Back to Step 2: Compare"
          onBack={() => onNavigateToTab('review')}
          secondaryAction={
            !auditReport
              ? {
                  label: isRunningAudit ? 'Checking...' : 'Run Check Now',
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

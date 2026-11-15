import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  OptimizationResult,
  AgentConfigurationInputs,
  WorkspaceTab,
} from '../types/agent';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import { StepHandoffBar } from './StepHandoffBar';
import { StepCompliancePanel } from './StepCompliancePanel';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Layers,
  MessageSquareCode,
  FileCode,
  Sparkles,
  Download,
  RotateCcw,
} from 'lucide-react';

interface SideBySideReviewProps {
  originalInputs: AgentConfigurationInputs;
  result: OptimizationResult | null;
  needsReoptimize?: boolean;
  onApplyRefinedToBuilder: () => void;
  onNavigateToTab: (tab: WorkspaceTab) => void;
  onOpenExport: () => void;
  onReoptimize: () => void;
  isOptimizing: boolean;
}

export const SideBySideReview: React.FC<SideBySideReviewProps> = ({
  originalInputs,
  result,
  needsReoptimize = false,
  onApplyRefinedToBuilder,
  onNavigateToTab,
  onOpenExport,
  onReoptimize,
  isOptimizing,
}) => {
  const [activeSegment, setActiveSegment] = useState<'compiled' | 'role' | 'arch' | 'domain' | 'persona' | 'changelog'>('compiled');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!result) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="depth-block rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-slate-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <div className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">
              Step 2 of 5 · Compare Compiled Rules
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
              Compare Old Draft &amp; Compiled Rule Engine
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Click Build Rules to turn your Step 1 inputs into a 4-checkpoint system instruction (`SP-01 → SP-04`) with JSON Schema enforcement ready to test and export.
            </p>
          </div>

          <StepHandoffBar
            stepLabel="Waiting to Build"
            completedSummary="Step 1 draft is ready."
            backLabel="Back to Step 1"
            onBack={() => onNavigateToTab('builder')}
            primaryLabel={isOptimizing ? 'Building...' : 'Build Rules'}
            primaryIcon="sparkles"
            isPrimaryLoading={isOptimizing}
            onPrimary={onReoptimize}
          />
        </div>
      </div>
    );
  }

  const { auditReport, refinedSections, compiledSystemInstruction } = result;
  const cleanedCompiled = simplifyAndRedactText(compiledSystemInstruction);

  const getSegmentComparison = () => {
    switch (activeSegment) {
      case 'role':
        return {
          original: `MAIN GOAL:\n${originalInputs.roleObjectives.primaryObjective}\n\nDAILY TASKS:\n${originalInputs.roleObjectives.primaryTasks}\n\nFINAL OUTPUT:\n${originalInputs.roleObjectives.finalOutputs}\n\nPASS RULES:\n${originalInputs.roleObjectives.successMetrics}`,
          refined: simplifyAndRedactText(
            `MAIN GOAL:\n${refinedSections.roleObjectives.primaryObjective}\n\nDAILY TASKS:\n${refinedSections.roleObjectives.primaryTasks}\n\nFINAL OUTPUT:\n${refinedSections.roleObjectives.finalOutputs}\n\nPASS RULES:\n${refinedSections.roleObjectives.successMetrics}`
          ),
        };
      case 'arch':
        return {
          original: `SAFE LIMITS:\n${originalInputs.systemArchitecture.operationalBoundaries}\n\nHARD RULES:\n${originalInputs.systemArchitecture.executionConstraints}\n\nTOOL RULES:\n${originalInputs.systemArchitecture.toolUsePolicies}\n\nSTEP ORDER:\n${originalInputs.systemArchitecture.workflowSequence}\n\nSTOP RULES:\n${originalInputs.systemArchitecture.edgeCases}`,
          refined: simplifyAndRedactText(
            `SAFE LIMITS:\n${refinedSections.systemArchitecture.operationalBoundaries}\n\nHARD RULES:\n${refinedSections.systemArchitecture.executionConstraints}\n\nTOOL RULES:\n${refinedSections.systemArchitecture.toolUsePolicies}\n\nSTEP ORDER:\n${refinedSections.systemArchitecture.workflowSequence}\n\nSTOP RULES:\n${refinedSections.systemArchitecture.edgeCases}`
          ),
        };
      case 'domain':
        return {
          original: `SKILLS:\n${originalInputs.domainExpertise.technicalCapabilities}\n\nGUIDES:\n${originalInputs.domainExpertise.knowledgeBases}\n\nSTANDARDS:\n${originalInputs.domainExpertise.referenceStandards}\n\nLABELS:\n${originalInputs.domainExpertise.algorithmicConventions}`,
          refined: simplifyAndRedactText(
            `SKILLS:\n${refinedSections.domainExpertise.technicalCapabilities}\n\nGUIDES:\n${refinedSections.domainExpertise.knowledgeBases}\n\nSTANDARDS:\n${refinedSections.domainExpertise.referenceStandards}\n\nLABELS:\n${refinedSections.domainExpertise.algorithmicConventions}`
          ),
        };
      case 'persona':
        return {
          original: `VOICE:\n${originalInputs.personaInteraction.toneAndVoice}\n\nSHORTNESS:\n${originalInputs.personaInteraction.communicationRegister}\n\nBANNED WORDS:\n${originalInputs.personaInteraction.forbiddenPhrasing}\n\nOUTPUT SHAPE:\n${originalInputs.personaInteraction.formatSchemas}`,
          refined: simplifyAndRedactText(
            `VOICE:\n${refinedSections.personaInteraction.toneAndVoice}\n\nSHORTNESS:\n${refinedSections.personaInteraction.communicationRegister}\n\nBANNED WORDS:\n${refinedSections.personaInteraction.forbiddenPhrasing}\n\nOUTPUT SHAPE:\n${refinedSections.personaInteraction.formatSchemas}`
          ),
        };
      default:
        return {
          original: `Draft Summary:\n- Goal: ${originalInputs.roleObjectives.primaryObjective || '(empty)'}\n- Limits: ${originalInputs.systemArchitecture.operationalBoundaries || '(empty)'}\n- Facts: ${originalInputs.domainExpertise.technicalCapabilities || '(empty)'}\n- Voice: ${originalInputs.personaInteraction.toneAndVoice || '(empty)'}`,
          refined: cleanedCompiled,
        };
    }
  };

  const currentDiff = getSegmentComparison();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Focused Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">
            Step 2 of 5 · Compiled Output
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Compiled Rules &amp; Runtime Flow
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {simplifyAndRedactText(result.executiveSummary)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {needsReoptimize && (
            <button
              type="button"
              onClick={onReoptimize}
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>Rebuild</span>
            </button>
          )}
          <button
            type="button"
            onClick={onApplyRefinedToBuilder}
            className="depth-strip inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-xl hover:border-neutral-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Edit in Step 1</span>
          </button>
          <button
            type="button"
            onClick={onOpenExport}
            className="depth-strip inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-xl hover:border-neutral-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export SDK</span>
          </button>
        </div>
      </div>

      {/* How the Final Output Functions Strip */}
      <div className="depth-strip rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200/80 dark:border-white/10">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-950 dark:text-white">
              How Your Final Output Functions When Deployed
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Every user prompt passes through these 4 ordered checkpoints inside the compiled system instruction before returning output.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenExport}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 whitespace-nowrap shrink-0"
          >
            View TypeScript / Python / JSON →
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Original Goal Kept</div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{auditReport.intentPreservationScore}%</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Precision Gain</div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white mt-1">
              +{auditReport.precisionEnhancementPercentage}%
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Conversational Fluff Cut</div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white mt-1">
              {auditReport.fluffEliminatedCount} lines
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Safeguards Added</div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white mt-1">
              {auditReport.gapsIdentifiedAndAddressed.length}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed Step 2 Rule Bar */}
      <StepCompliancePanel
        step="review"
        satisfiedIds={[
          ...(/SINGLE_PASS_ONLY|max_auto_adjust_loops|no.*loop/i.test(cleanedCompiled)
            ? ['req-2-1']
            : []),
          ...(result.subprocessTrace && result.subprocessTrace.length >= 4 ? ['req-2-2'] : []),
          ...(!needsReoptimize ? ['req-2-3'] : []),
        ]}
      />

      {/* Helper Steps Strip */}
      {result.subprocessTrace && result.subprocessTrace.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {result.subprocessTrace.map((sp) => (
            <div
              key={sp.subprocessId}
              className="depth-strip p-4 rounded-2xl space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{sp.subprocessId}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{sp.status}</span>
              </div>
              <div className="text-sm font-bold text-neutral-950 dark:text-white">
                {simplifyAndRedactText(sp.name)}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug">
                {simplifyAndRedactText(sp.role)}
              </p>
              <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-snug pt-0.5">
                {simplifyAndRedactText(sp.summary)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Segment Tabs */}
      <div className="depth-strip flex items-center gap-1.5 p-2 rounded-2xl overflow-x-auto">
        {[
          { id: 'compiled' as const, label: 'All New Rules', icon: FileCode },
          { id: 'role' as const, label: 'Goal', icon: ShieldCheck },
          { id: 'arch' as const, label: 'Limits', icon: Cpu },
          { id: 'domain' as const, label: 'Facts', icon: Layers },
          { id: 'persona' as const, label: 'Voice', icon: MessageSquareCode },
          { id: 'changelog' as const, label: `Changes (${auditReport.modifications.length})`, icon: Sparkles },
        ].map((tab) => {
          const isActive = activeSegment === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSegment(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-colors z-10 ${
                isActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sideBySideReviewPill"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-neutral-200 dark:border-white/15 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Diff Panels or Changes List */}
      {activeSegment !== 'changelog' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="depth-block flex flex-col rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/10">
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Old Draft
                <span className="ml-2 text-xs font-mono tabular-nums text-neutral-500">
                  · {currentDiff.original.split('\n').length} lines
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(currentDiff.original, 'orig')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
              >
                {copiedKey === 'orig' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'orig' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-5 flex-1 font-mono text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[480px] select-text">
              {currentDiff.original}
            </div>
          </div>

          <div className="depth-block flex flex-col rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200/80 dark:border-white/10">
              <div className="text-sm font-bold text-neutral-950 dark:text-white">
                New Simple Rules
                <span className="ml-2 text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  · {currentDiff.refined.split('\n').length} lines
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(currentDiff.refined, 'refined')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800"
              >
                {copiedKey === 'refined' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'refined' ? 'Copied' : 'Copy Rules'}</span>
              </button>
            </div>
            <div className="p-5 flex-1 font-mono text-xs sm:text-sm text-neutral-950 dark:text-neutral-50 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[480px] select-text">
              {currentDiff.refined}
            </div>
          </div>
        </div>
      ) : (
        <div className="depth-block rounded-3xl divide-y divide-neutral-200/80 dark:divide-white/10 overflow-hidden">
          {auditReport.modifications.map((item, idx) => (
            <div key={idx} className="p-5 sm:p-6 space-y-3">
              <div className="text-sm font-bold text-neutral-950 dark:text-white">
                {simplifyAndRedactText(item.segment)}
                <span className="mx-2 text-neutral-400">·</span>
                <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  {simplifyAndRedactText(item.category)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
                <div className="p-3.5 rounded-xl bg-neutral-100/80 dark:bg-slate-800/70 text-neutral-700 dark:text-neutral-300">
                  {simplifyAndRedactText(item.originalExcerpt || '(Empty in old draft)')}
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 text-neutral-950 dark:text-neutral-50 border border-emerald-200/80 dark:border-emerald-800/40">
                  {simplifyAndRedactText(item.revisedExcerpt)}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">Why: </span>
                {simplifyAndRedactText(item.technicalRationale)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Handoff Bar */}
      <div className="depth-block rounded-3xl px-6 sm:px-8 pb-6">
        <StepHandoffBar
          stepLabel="Step 2 Complete"
          completedSummary={`${auditReport.intentPreservationScore}% goal match · ${auditReport.modifications.length} updates ready.`}
          isStepComplete={true}
          backLabel="Back to Step 1"
          onBack={() => onNavigateToTab('builder')}
          secondaryAction={{
            label: 'Edit in Step 1',
            onClick: onApplyRefinedToBuilder,
          }}
          primaryLabel="Next: Step 3 Check"
          onPrimary={() => onNavigateToTab('audit')}
        />
      </div>
    </div>
  );
};

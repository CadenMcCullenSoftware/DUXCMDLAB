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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center space-y-4 backdrop-blur-xl">
          <div className="w-11 h-11 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              Step 2 of 5 · Compare Old vs. New
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Build &amp; Compare Simple Rules
            </h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              Click Build Rules to turn your Step 1 draft into clean 4-step rules and see every change side by side.
            </p>
          </div>

          <StepHandoffBar
            stepLabel="Waiting to Build Rules"
            completedSummary="Your Step 1 draft is ready to turn into clean 4-step rules."
            backLabel="Back to Step 1: Setup"
            onBack={() => onNavigateToTab('builder')}
            primaryLabel={isOptimizing ? 'Building...' : 'Build Rules Now'}
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
          original: `Old Draft Across 4 Parts:\n- Goal: ${originalInputs.roleObjectives.primaryObjective || '(empty)'}\n- Limits: ${originalInputs.systemArchitecture.operationalBoundaries || '(empty)'}\n- Facts: ${originalInputs.domainExpertise.technicalCapabilities || '(empty)'}\n- Voice: ${originalInputs.personaInteraction.toneAndVoice || '(empty)'}`,
          refined: cleanedCompiled,
        };
    }
  };

  const currentDiff = getSegmentComparison();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Focused Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            Step 2 of 5 · Compare Old vs. New
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-0.5">
            Compare Simple 4-Step Rules
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Check your old draft next to the new 5th-grade 4-step rules built for the main engine.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {needsReoptimize && (
            <button
              type="button"
              onClick={onReoptimize}
              disabled={isOptimizing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>Re-build Changed Draft</span>
            </button>
          )}
          <button
            type="button"
            onClick={onApplyRefinedToBuilder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Send to Step 1</span>
          </button>
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Compact Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md">
        <div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Goal Kept</div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{auditReport.intentPreservationScore}%</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Clarity Gain</div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
            +{auditReport.precisionEnhancementPercentage}%
          </div>
        </div>
        <div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Fluff Cut</div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
            {auditReport.fluffEliminatedCount} lines
          </div>
        </div>
        <div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Gaps Fixed</div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
            {auditReport.gapsIdentifiedAndAddressed.length} items
          </div>
        </div>
      </div>

      {/* Step 2 Rule Checks */}
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
              className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{sp.subprocessId}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{sp.status}</span>
              </div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {simplifyAndRedactText(sp.name)}
              </div>
              {sp.commandOp && (
                <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate">
                  {sp.commandOp}
                </div>
              )}
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                {simplifyAndRedactText(sp.summary)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Segment Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100/75 dark:bg-neutral-900/75 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-x-auto">
        {[
          { id: 'compiled' as const, label: 'All New Rules', icon: FileCode },
          { id: 'role' as const, label: 'Goal', icon: ShieldCheck },
          { id: 'arch' as const, label: 'Limits', icon: Cpu },
          { id: 'domain' as const, label: 'Facts', icon: Layers },
          { id: 'persona' as const, label: 'Voice', icon: MessageSquareCode },
          { id: 'changelog' as const, label: `What Changed (${auditReport.modifications.length})`, icon: Sparkles },
        ].map((tab) => {
          const isActive = activeSegment === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSegment(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors z-10 ${
                isActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sideBySideReviewPill"
                  className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-lg shadow-xs border border-neutral-200 dark:border-neutral-700 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Diff Panels or What Changed List */}
      {activeSegment !== 'changelog' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="flex flex-col bg-white/85 dark:bg-neutral-900/85 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Old Draft
                <span className="ml-2 text-[11px] font-mono tabular-nums text-neutral-500">
                  · {currentDiff.original.split('\n').length} lines
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(currentDiff.original, 'orig')}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {copiedKey === 'orig' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'orig' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-4 flex-1 font-mono text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[460px] select-text">
              {currentDiff.original}
            </div>
          </div>

          <div className="flex flex-col bg-white/95 dark:bg-neutral-900/95 border border-neutral-300 dark:border-neutral-700 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                New Simple Rules
                <span className="ml-2 text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  · {currentDiff.refined.split('\n').length} lines
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(currentDiff.refined, 'refined')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-md hover:bg-neutral-800"
              >
                {copiedKey === 'refined' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'refined' ? 'Copied' : 'Copy Rules'}</span>
              </button>
            </div>
            <div className="p-4 flex-1 font-mono text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[460px] select-text">
              {currentDiff.refined}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden">
          {auditReport.modifications.map((item, idx) => (
            <div key={idx} className="p-5 space-y-2.5">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {simplifyAndRedactText(item.segment)}
                <span className="mx-2 text-neutral-400">·</span>
                <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                  {simplifyAndRedactText(item.category)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400">
                  {simplifyAndRedactText(item.originalExcerpt || '(Empty in old draft)')}
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 text-neutral-900 dark:text-neutral-100 border border-emerald-200/70 dark:border-emerald-800/40">
                  {simplifyAndRedactText(item.revisedExcerpt)}
                </div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Why: </span>
                {simplifyAndRedactText(item.technicalRationale)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Handoff Bar */}
      <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 pb-6">
        <StepHandoffBar
          stepLabel="Step 2 Done"
          completedSummary={`New simple rules ready with ${auditReport.intentPreservationScore}% goal match and ${auditReport.modifications.length} clean updates.`}
          isStepComplete={true}
          backLabel="Back to Step 1: Setup"
          onBack={() => onNavigateToTab('builder')}
          secondaryAction={{
            label: 'Send to Step 1',
            onClick: onApplyRefinedToBuilder,
          }}
          primaryLabel="Next: Step 3 Check"
          onPrimary={() => onNavigateToTab('audit')}
        />
      </div>
    </div>
  );
};

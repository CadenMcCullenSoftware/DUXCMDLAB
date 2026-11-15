import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  AgentConfigurationInputs,
  AgentPreset,
  WorkspaceTab,
} from '../types/agent';
import { PRESET_AGENTS, TEACHING_TEMPLATES } from '../data/presets';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import { FieldWithGuidance } from './FieldWithGuidance';
import { StepHandoffBar } from './StepHandoffBar';
import { StepCompliancePanel } from './StepCompliancePanel';
import { SystemBlueprintBanner } from './SystemBlueprintBanner';
import {
  ShieldCheck,
  Cpu,
  Layers,
  MessageSquareCode,
  RotateCcw,
  BookOpen,
  SlidersHorizontal,
  GraduationCap,
  Play,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export type BuilderSection = 'role' | 'arch' | 'domain' | 'persona';

interface BuilderViewProps {
  inputs: AgentConfigurationInputs;
  setInputs: React.Dispatch<React.SetStateAction<AgentConfigurationInputs>>;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  onSelectPreset: (preset: AgentPreset) => void;
  activePreset: AgentPreset | null;
  onRunRecommendedProbe: (probeText: string) => void;
  onResetToBlank: () => void;
  onNavigateToTab: (tab: WorkspaceTab) => void;
  hasOptimizedResult: boolean;
  requestedSection?: { section: BuilderSection; nonce: number } | null;
}

const SECTION_ORDER: BuilderSection[] = ['role', 'arch', 'domain', 'persona'];

const SECTION_META: Record<
  BuilderSection,
  { num: string; label: string; subprocessTag: string; summary: string; icon: React.ComponentType<{ className?: string }> }
> = {
  role: {
    num: '1.1',
    label: 'Purpose & Goal',
    subprocessTag: 'SP-01',
    summary: 'Defines the exact job, required deliverables, and measurable pass criteria enforced on every turn.',
    icon: ShieldCheck,
  },
  arch: {
    num: '1.2',
    label: 'Safety & Limits',
    subprocessTag: 'SP-02',
    summary: 'Sets hard "never do" boundaries, blocks auto-fix loops, refuses profiling, and controls allowed commands.',
    icon: Cpu,
  },
  domain: {
    num: '1.3',
    label: 'Facts & Sources',
    subprocessTag: 'SP-03',
    summary: 'Grounds answers in verified files, math checks, 4 proof tiers, and verifiable https:// URLs.',
    icon: Layers,
  },
  persona: {
    num: '1.4',
    label: 'Output Format',
    subprocessTag: 'SP-04',
    summary: 'Locks response structure (TechnicalResponsePayload JSON or report), tone, and zero ambient filler.',
    icon: MessageSquareCode,
  },
};

export const BuilderView: React.FC<BuilderViewProps> = ({
  inputs,
  setInputs,
  optimizationMode,
  setOptimizationMode,
  onOptimize,
  isOptimizing,
  onSelectPreset,
  activePreset,
  onRunRecommendedProbe,
  onResetToBlank,
  onNavigateToTab,
  hasOptimizedResult,
  requestedSection,
}) => {
  const [activeSection, setActiveSection] = useState<BuilderSection>('role');
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState<boolean>(false);
  const [showPresetMenu, setShowPresetMenu] = useState<boolean>(false);

  useEffect(() => {
    if (requestedSection?.section) {
      setActiveSection(requestedSection.section);
    }
  }, [requestedSection]);

  const updateField = (
    section: keyof AgentConfigurationInputs,
    field: string,
    value: string
  ) => {
    setInputs((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const getFilledCount = (section: BuilderSection): { filled: number; total: number } => {
    const map: Record<BuilderSection, string[]> = {
      role: Object.values(inputs.roleObjectives),
      arch: Object.values(inputs.systemArchitecture),
      domain: Object.values(inputs.domainExpertise),
      persona: Object.values(inputs.personaInteraction),
    };
    const vals = map[section];
    return {
      filled: vals.filter((v) => v.trim().length > 0).length,
      total: vals.length,
    };
  };

  const currentIdx = SECTION_ORDER.indexOf(activeSection);
  const currentMeta = SECTION_META[activeSection];
  const currentProgress = getFilledCount(activeSection);
  const nextSection = currentIdx < SECTION_ORDER.length - 1 ? SECTION_ORDER[currentIdx + 1] : null;
  const prevSection = currentIdx > 0 ? SECTION_ORDER[currentIdx - 1] : null;

  const totalPillarsWithContent = SECTION_ORDER.filter((s) => getFilledCount(s).filled > 0).length;

  const hasAntiLoopClause = /no.*loop|single_pass|max_auto_adjust_loops|auto-loop|loop/i.test(
    `${inputs.systemArchitecture.executionConstraints} ${inputs.systemArchitecture.operationalBoundaries}`
  );
  const hasCommandOpsClause = /cmd:[a-z_]+/i.test(
    `${inputs.systemArchitecture.toolUsePolicies} ${inputs.systemArchitecture.executionConstraints}`
  );
  const hasDeterministicHalt =
    inputs.systemArchitecture.edgeCases.trim().length > 8 &&
    inputs.personaInteraction.formatSchemas.trim().length > 8;

  const satisfiedComplianceIds = [
    ...(hasAntiLoopClause ? ['req-1-1'] : []),
    ...(hasCommandOpsClause ? ['req-1-2'] : []),
    ...(hasDeterministicHalt ? ['req-1-3'] : []),
  ];

  const handleApplyCompliantBaseline = () => {
    setInputs((prev) => {
      const existingConstraints = prev.systemArchitecture.executionConstraints.trim();
      const existingTools = prev.systemArchitecture.toolUsePolicies.trim();
      const existingEdges = prev.systemArchitecture.edgeCases.trim();
      const existingSchema = prev.personaInteraction.formatSchemas.trim();

      const antiLoopSnippet =
        'Refuse repeating auto-fix loops on code or logic (SINGLE_PASS_ONLY, max_auto_adjust_loops = 0); change loop requests into 1 cmd:propose_single_patch -> cmd:escalate_human_gate step.';
      const cmdOpsSnippet =
        'Allowed AI commands: cmd:triage_resource, cmd:search_evidence, cmd:verify_claim, cmd:audit_invariants, cmd:propose_single_patch, cmd:escalate_human_gate.';
      const haltSnippet =
        'On broken input, bad math, or auto-loop requests, stop with [LOOP RULE BROKEN] or [FORMAT MISMATCH] and wait for (y/N). Give 0% power to personal stories.';
      const schemaSnippet =
        '### AI Command Check\n- Command: `cmd:...` | Policy: SINGLE_PASS_ONLY\n- Plain 5th-grade facts & (y/N) change proposal';

      return {
        ...prev,
        systemArchitecture: {
          ...prev.systemArchitecture,
          executionConstraints: /max_auto_adjust_loops|SINGLE_PASS_ONLY/i.test(existingConstraints)
            ? existingConstraints
            : existingConstraints
            ? `${existingConstraints}\n${antiLoopSnippet}`
            : antiLoopSnippet,
          toolUsePolicies: /cmd:[a-z_]+/i.test(existingTools)
            ? existingTools
            : existingTools
            ? `${existingTools}\n${cmdOpsSnippet}`
            : cmdOpsSnippet,
          edgeCases: existingEdges.length > 8 ? existingEdges : haltSnippet,
        },
        personaInteraction: {
          ...prev.personaInteraction,
          formatSchemas: existingSchema.length > 8 ? existingSchema : schemaSnippet,
        },
      };
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Focused Step Header + Compact Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs sm:text-sm font-mono text-neutral-500 dark:text-neutral-400">
            Step 1 of 5 · Configure Rules
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Design Your Agent Rule Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed">
            Define what the AI must accomplish, what it is forbidden from doing, and the exact JSON or report structure it must return.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowTemplatesDrawer((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-colors ${
              showTemplatesDrawer
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                : 'depth-strip text-neutral-800 dark:text-neutral-100 hover:border-neutral-400'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Lessons</span>
            {showTemplatesDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <div className="depth-strip flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm">
            <SlidersHorizontal className="w-4 h-4 text-neutral-500 shrink-0" />
            <select
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value)}
              aria-label="Final output compiler format"
              className="bg-transparent border-0 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:ring-0 focus:outline-none cursor-pointer pr-1"
            >
              <option value="technical_json_schema" className="dark:bg-slate-900">JSON Schema Payload</option>
              <option value="strict_technical" className="dark:bg-slate-900">Strict Plain Rules</option>
              <option value="deep_specification" className="dark:bg-slate-900">Full Rule Spec</option>
              <option value="minimalist_invariant" className="dark:bg-slate-900">Minimal Guardrails</option>
            </select>
          </div>
        </div>
      </div>

      {/* What / Why / How Final Output Functions */}
      <SystemBlueprintBanner
        onJumpToAudit={() => onNavigateToTab('audit')}
        onJumpToSimulator={() => onNavigateToTab('simulator')}
      />

      {/* Collapsed Step 1 Rule Bar */}
      <StepCompliancePanel
        step="builder"
        satisfiedIds={satisfiedComplianceIds}
        actionButton={{
          label: 'Add No-Loop Rules',
          onClick: handleApplyCompliantBaseline,
        }}
      />

      {/* Collapsible Starter Lessons Drawer */}
      {showTemplatesDrawer && (
        <div className="depth-block p-6 rounded-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-white/10">
            <h2 className="text-base font-bold text-neutral-950 dark:text-white">
              Starter Lessons
            </h2>

            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => setShowPresetMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100/80 dark:bg-slate-800 border border-neutral-200 dark:border-white/10 rounded-xl hover:border-neutral-400"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>All Presets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onResetToBlank();
                  setShowPresetMenu(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-white/10 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {showPresetMenu && (
                <div className="absolute right-0 top-11 w-72 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-white/15 rounded-2xl shadow-2xl py-1 z-30 max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-white/10">
                  {PRESET_AGENTS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset(preset);
                        setShowPresetMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm hover:bg-neutral-50 dark:hover:bg-slate-800"
                    >
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {simplifyAndRedactText(preset.name)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {simplifyAndRedactText(preset.category)}
                        {preset.difficulty ? ` · ${simplifyAndRedactText(preset.difficulty)}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEACHING_TEMPLATES.map((tpl) => {
              const isSelected = activePreset?.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onSelectPreset(tpl)}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                      : 'bg-white/75 dark:bg-slate-800/60 border-neutral-200/80 dark:border-white/10 hover:border-neutral-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className={`text-xs font-mono ${isSelected ? 'opacity-75' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {tpl.difficulty || 'Sample'}
                    </div>
                    <div className="text-sm font-bold leading-snug">{simplifyAndRedactText(tpl.name)}</div>
                    <p className={`text-xs line-clamp-2 ${isSelected ? 'opacity-85' : 'text-neutral-600 dark:text-neutral-300'}`}>
                      {simplifyAndRedactText(tpl.description)}
                    </p>
                  </div>
                  <div className="text-xs font-semibold">
                    {isSelected ? 'Loaded' : 'Load →'}
                  </div>
                </button>
              );
            })}
          </div>

          {activePreset?.isTeachingTemplate && activePreset.teachingLesson && (
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/65 border border-neutral-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                  {simplifyAndRedactText(activePreset.teachingLesson)}
                </p>
                {activePreset.expectedPitfalls && activePreset.expectedPitfalls.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-amber-700 dark:text-amber-400">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Watch out:
                    </span>
                    {activePreset.expectedPitfalls.map((pitfall, idx) => (
                      <span key={idx}>• {simplifyAndRedactText(pitfall)}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateToTab('audit')}
                  className="px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-white/15 rounded-xl hover:border-neutral-400"
                >
                  Check Draft
                </button>
                {activePreset.recommendedTestProbe && (
                  <button
                    type="button"
                    onClick={() => onRunRecommendedProbe(activePreset.recommendedTestProbe!)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-xl"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Test</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean 4-Part Picker */}
      <div className="depth-strip grid grid-cols-2 md:grid-cols-4 gap-2 p-2 rounded-2xl">
        {SECTION_ORDER.map((sectionId) => {
          const meta = SECTION_META[sectionId];
          const Icon = meta.icon;
          const isActive = activeSection === sectionId;
          const progress = getFilledCount(sectionId);

          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => setActiveSection(sectionId)}
              className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors z-10 ${
                isActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="builderSubStepIndicator"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border border-neutral-200/90 dark:border-white/15 shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold truncate">
                  {meta.num} {meta.label}
                </span>
                <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400 shrink-0">
                  {progress.filled}/{progress.total}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Elevated Depth Editor Block */}
      <div className="depth-block rounded-3xl p-6 sm:p-8 lg:p-10">
        <div className="pb-5 mb-7 border-b border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">
              {currentMeta.num} {currentMeta.label}
              <span className="ml-2.5 text-xs sm:text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                · Gate {currentMeta.subprocessTag}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {currentMeta.summary}
            </p>
          </div>
          <span className="text-xs sm:text-sm font-mono tabular-nums text-neutral-500 dark:text-neutral-400 shrink-0 pt-0.5">
            {currentProgress.filled}/{currentProgress.total} filled
          </span>
        </div>

        {/* Sub-Step 1.1: Main Goal */}
        {activeSection === 'role' && (
          <div className="space-y-6">
            <FieldWithGuidance
              label="Main Goal"
              hint="Write in 1–2 plain sentences what this setup does."
              whyItMatters="Keeps the engine focused on your main job."
              exampleText="Check code updates for safety bugs and suggest 1 small fix using simple 5th-grade words."
              value={inputs.roleObjectives.primaryObjective}
              onChange={(v) => updateField('roleObjectives', 'primaryObjective', v)}
              placeholder="e.g. Check numbers and code updates safely..."
              rows={2}
            />

            <FieldWithGuidance
              label="Daily Tasks"
              hint="List the exact steps run on each message."
              whyItMatters="Turns loose wishes into clear steps."
              exampleText="1. Read numbers or code; 2. Check safety limits; 3. Verify math equations; 4. Show 1 small fix."
              value={inputs.roleObjectives.primaryTasks}
              onChange={(v) => updateField('roleObjectives', 'primaryTasks', v)}
              placeholder="e.g. 1. Read input, 2. Check limits, 3. Check math..."
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Final Output"
                hint="Name the result format (report, SQL, JSON, table)."
                whyItMatters="Stops extra chatter when you want a clean output."
                exampleText="Short Markdown report listing line numbers, risk level, and 1 small fix."
                value={inputs.roleObjectives.finalOutputs}
                onChange={(v) => updateField('roleObjectives', 'finalOutputs', v)}
                placeholder="e.g. Short report with exact math and 1 safe fix..."
                rows={3}
              />

              <FieldWithGuidance
                label="How to Know It Passed"
                hint="Set pass rules (zero guesses, exact math, simple words)."
                whyItMatters="Gives Step 3 Check clear rules to score."
                exampleText="0% power spent on personal stories, 100% accurate math (like 2 + 2 = 4), and simple 5th-grade words."
                value={inputs.roleObjectives.successMetrics}
                onChange={(v) => updateField('roleObjectives', 'successMetrics', v)}
                placeholder="e.g. Zero guesses; exact math; 100% simple words..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Sub-Step 1.2: Hard Limits */}
        {activeSection === 'arch' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Safe Limits"
                hint="List allowed files, numbers, or rules—nothing else."
                whyItMatters="Stops guessing about missing files."
                exampleText="Work only on the numbers and files given. Give 0% power to personal stories or personal roles."
                value={inputs.systemArchitecture.operationalBoundaries}
                onChange={(v) => updateField('systemArchitecture', 'operationalBoundaries', v)}
                placeholder="e.g. Read-only on given files; zero guessing..."
                rows={3}
              />

              <FieldWithGuidance
                label='Hard "Never Do" Rules'
                hint="Set strict stop rules and no-loop locks."
                whyItMatters="Blocks repeating auto-fix loops and overrides."
                exampleText="Never loop auto-edits on code or logic (max_auto_adjust_loops = 0). Never mark unrun code as Verified."
                value={inputs.systemArchitecture.executionConstraints}
                onChange={(v) => updateField('systemArchitecture', 'executionConstraints', v)}
                placeholder="e.g. Never run auto-loops or edit files without asking (y/N)..."
                rows={3}
              />
            </div>

            <FieldWithGuidance
              label="Step Order"
              hint="Write the step order from input to final output."
              whyItMatters="Runs safety and math gates before any answer."
              exampleText="1. SP-01 Power & Goal -> 2. SP-02 Limits & No-Loop -> 3. SP-03 Math & Proof -> 4. SP-04 Person Gate."
              value={inputs.systemArchitecture.workflowSequence}
              onChange={(v) => updateField('systemArchitecture', 'workflowSequence', v)}
              placeholder="e.g. 1. Check goal -> 2. Check limits -> 3. Check math -> 4. Send answer..."
              rows={2}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Allowed AI Commands"
                hint="List allowed one-pass cmd:* commands."
                whyItMatters="Keeps actions limited and safe."
                exampleText="Allowed AI commands only: cmd:triage_resource, cmd:search_evidence, cmd:verify_claim, cmd:propose_single_patch, cmd:escalate_human_gate."
                value={inputs.systemArchitecture.toolUsePolicies}
                onChange={(v) => updateField('systemArchitecture', 'toolUsePolicies', v)}
                placeholder="e.g. cmd:search_evidence and cmd:verify_claim only..."
                rows={2}
              />

              <FieldWithGuidance
                label="Stop Rules for Bad Input"
                hint="Say what happens on broken input, bad math, or loops."
                whyItMatters="Prevents guessing when messy input arrives."
                exampleText="If input asks for an auto-loop, stop with [LOOP RULE BROKEN] and show 1 fix waiting for (y/N)."
                value={inputs.systemArchitecture.edgeCases}
                onChange={(v) => updateField('systemArchitecture', 'edgeCases', v)}
                placeholder="e.g. Stop if math is wrong or JSON is broken..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Sub-Step 1.3: Facts & Rules */}
        {activeSection === 'domain' && (
          <div className="space-y-6">
            <FieldWithGuidance
              label="Checking Methods"
              hint="Name the checks or math rules used."
              whyItMatters="Keeps answers concrete and step-by-step."
              exampleText="Math equation checks, safe SQL checks, folder path rules, and 4-level claim checks."
              value={inputs.domainExpertise.technicalCapabilities}
              onChange={(v) => updateField('domainExpertise', 'technicalCapabilities', v)}
              placeholder="e.g. Math checks, file reading, SQL safety..."
              rows={3}
            />

            <FieldWithGuidance
              label="Trusted Guides & Files"
              hint="Name official docs or config files to follow."
              whyItMatters="Anchors answers to real docs."
              exampleText="Official TypeScript guide, SQL safety list, and .config/duxcmd.json."
              value={inputs.domainExpertise.knowledgeBases}
              onChange={(v) => updateField('domainExpertise', 'knowledgeBases', v)}
              placeholder="e.g. Official Python guide, company policy file..."
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Safety & Word Rules"
                hint="Enforce simple 5th-grade language and safety rules."
                whyItMatters="Swaps hard words or marks them [REDACTED]."
                exampleText="Simple 5th-grade words only; redact hard unknown words as [REDACTED]. Follow Zero Trust folder rules."
                value={inputs.domainExpertise.referenceStandards}
                onChange={(v) => updateField('domainExpertise', 'referenceStandards', v)}
                placeholder="e.g. Simple 5th-grade words only, Zero Trust folder locks..."
                rows={2}
              />

              <FieldWithGuidance
                label="Proof Tags & Labels"
                hint="Set exact tags for math, dates, and proof levels."
                whyItMatters="Keeps every reply matching one clear layout."
                exampleText="Use exact proof tags [Verified | Supported Inference | Unknown | Disputed] and SINGLE_PASS_ONLY."
                value={inputs.domainExpertise.algorithmicConventions}
                onChange={(v) => updateField('domainExpertise', 'algorithmicConventions', v)}
                placeholder="e.g. Exact proof tags, UTC dates, cmd:* prefixes..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Sub-Step 1.4: Voice & Shape */}
        {activeSection === 'persona' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Plain Voice"
                hint="Describe the clear, factual tone."
                whyItMatters="Keeps answers calm and direct."
                exampleText="Calm Fact Checker: short, direct 5th-grade words, zero small talk."
                value={inputs.personaInteraction.toneAndVoice}
                onChange={(v) => updateField('personaInteraction', 'toneAndVoice', v)}
                placeholder="e.g. Calm, direct, 5th-grade words only..."
                rows={3}
              />

              <FieldWithGuidance
                label="Shortness Rules"
                hint="Keep sentences short and ban guessing words."
                whyItMatters="Keeps fluff below 5% in Step 3 Check."
                exampleText="Short bullet points in plain 5th-grade words. Never guess."
                value={inputs.personaInteraction.communicationRegister}
                onChange={(v) => updateField('personaInteraction', 'communicationRegister', v)}
                placeholder="e.g. Short clear bullets; zero guesses..."
                rows={3}
              />
            </div>

            <FieldWithGuidance
              label="Banned Fluff"
              hint="List small talk or hard words to keep out."
              whyItMatters="Stops unwanted filler."
              exampleText="Banned: chatty sign-offs, AI self-talk, unsure guesses, or hard jargon."
              value={inputs.personaInteraction.forbiddenPhrasing}
              onChange={(v) => updateField('personaInteraction', 'forbiddenPhrasing', v)}
              placeholder="e.g. Polite sign-offs, guessing claims, small talk..."
              rows={2}
            />

            <FieldWithGuidance
              label="Output Shape"
              hint="Set exact headings, table columns, or JSON layout."
              whyItMatters="Keeps every answer tidy and easy to scan."
              exampleText="### Finding [RISK]\n- File & Line\n- Plain Reason\n- 1 Small Fix"
              value={inputs.personaInteraction.formatSchemas}
              onChange={(v) => updateField('personaInteraction', 'formatSchemas', v)}
              placeholder="e.g. ### Summary / ### Findings / ### 1 Small Fix..."
              rows={3}
            />
          </div>
        )}

        {/* Step Handoff Bar */}
        <StepHandoffBar
          stepLabel={`${currentMeta.num} ${currentMeta.label}`}
          completedSummary={
            nextSection
              ? `${currentProgress.filled}/${currentProgress.total} boxes filled here.`
              : `${totalPillarsWithContent}/4 parts ready. Build rules next.`
          }
          isStepComplete={currentProgress.filled >= Math.max(1, Math.ceil(currentProgress.total / 2))}
          backLabel={prevSection ? `Back: ${SECTION_META[prevSection].num}` : undefined}
          onBack={prevSection ? () => setActiveSection(prevSection) : undefined}
          secondaryAction={
            nextSection
              ? {
                  label: hasOptimizedResult ? 'Go to Step 2' : 'Build Rules',
                  onClick: hasOptimizedResult ? () => onNavigateToTab('review') : onOptimize,
                  disabled: isOptimizing,
                }
              : undefined
          }
          primaryLabel={
            nextSection
              ? `Next: ${SECTION_META[nextSection].num} ${SECTION_META[nextSection].label}`
              : isOptimizing
              ? 'Building Rules...'
              : 'Build Rules'
          }
          primaryIcon={nextSection ? 'arrow' : 'sparkles'}
          isPrimaryLoading={!nextSection && isOptimizing}
          onPrimary={() => {
            if (nextSection) {
              setActiveSection(nextSection);
            } else {
              onOptimize();
            }
          }}
        />
      </div>
    </div>
  );
};

import React, { useState } from 'react';
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
}

type BuilderSection = 'role' | 'arch' | 'domain' | 'persona';

const SECTION_ORDER: BuilderSection[] = ['role', 'arch', 'domain', 'persona'];

const SECTION_META: Record<
  BuilderSection,
  { num: string; label: string; subprocessTag: string; summary: string; icon: React.ComponentType<{ className?: string }> }
> = {
  role: {
    num: '1.1',
    label: 'Main Goal',
    subprocessTag: 'SP-01 · Goal',
    summary: 'Main job, daily tasks, final output, and how to know it passed.',
    icon: ShieldCheck,
  },
  arch: {
    num: '1.2',
    label: 'Hard Limits',
    subprocessTag: 'SP-02 · No-Loop & Limits',
    summary: 'Safety limits, no auto-loop rules, allowed cmd:* commands, and stop rules.',
    icon: Cpu,
  },
  domain: {
    num: '1.3',
    label: 'Facts & Rules',
    subprocessTag: 'SP-03 · Proof & Math',
    summary: 'Checking skills, trusted guides, 5th-grade word rules, and 4 proof levels.',
    icon: Layers,
  },
  persona: {
    num: '1.4',
    label: 'Voice & Shape',
    subprocessTag: 'SP-04 · Person Gate',
    summary: 'Plain calm voice, banned fluff words, and clear output headings.',
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
}) => {
  const [activeSection, setActiveSection] = useState<BuilderSection>('role');
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState<boolean>(false);
  const [showPresetMenu, setShowPresetMenu] = useState<boolean>(false);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Focused Step Header + Compact Utility Triggers */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            Step 1 of 5 · Set Up Helper Steps
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-0.5">
            Set Up Simple Reasoning Rules
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Write clear 5th-grade rules for goals, safety limits, math checks, and plain answers. Open <span className="font-semibold text-neutral-800 dark:text-neutral-200">Example &amp; Why</span> on any box to see an example.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowTemplatesDrawer((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showTemplatesDrawer
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                : 'bg-white/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Starter Lessons</span>
            {showTemplatesDrawer ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white/80 dark:bg-neutral-900/80 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <select
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value)}
              aria-label="Rule build style"
              className="bg-transparent border-0 text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:ring-0 focus:outline-none cursor-pointer pr-1"
            >
              <option value="strict_technical" className="dark:bg-neutral-900">Strict Simple</option>
              <option value="deep_specification" className="dark:bg-neutral-900">Full Rule Sheet</option>
              <option value="minimalist_invariant" className="dark:bg-neutral-900">Short Limits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step 1 Rule Checks & Notes */}
      <StepCompliancePanel
        step="builder"
        satisfiedIds={satisfiedComplianceIds}
        actionButton={{
          label: 'Add No-Loop & Command Rules',
          onClick: handleApplyCompliantBaseline,
        }}
      />

      {/* Collapsible Starter Lessons Drawer */}
      {showTemplatesDrawer && (
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800/80">
            <div>
              <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Sample Lessons &amp; Starter Setups
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Pick a sample to see how weak drafts compare with strong, simple rules.
              </p>
            </div>

            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => setShowPresetMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400"
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Draft</span>
              </button>

              {showPresetMenu && (
                <div className="absolute right-0 top-10 w-72 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl py-1 z-30 max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700/50">
                  {PRESET_AGENTS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset(preset);
                        setShowPresetMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                    >
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {simplifyAndRedactText(preset.name)}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
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
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                      : 'bg-neutral-50/70 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className={`text-[10px] font-mono ${isSelected ? 'opacity-75' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {tpl.difficulty || 'Sample'}
                    </div>
                    <div className="text-xs font-bold leading-snug">{simplifyAndRedactText(tpl.name)}</div>
                    <p className={`text-[11px] line-clamp-2 ${isSelected ? 'opacity-85' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {simplifyAndRedactText(tpl.description)}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold">
                    {isSelected ? 'Loaded in Step 1' : 'Load Lesson →'}
                  </div>
                </button>
              );
            })}
          </div>

          {activePreset?.isTeachingTemplate && activePreset.teachingLesson && (
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Lesson Note: {simplifyAndRedactText(activePreset.name)}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {simplifyAndRedactText(activePreset.teachingLesson)}
                </p>
                {activePreset.expectedPitfalls && activePreset.expectedPitfalls.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-amber-700 dark:text-amber-400">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      Common Mistakes:
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
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-neutral-400"
                >
                  Check Draft First
                </button>
                {activePreset.recommendedTestProbe && (
                  <button
                    type="button"
                    onClick={() => onRunRecommendedProbe(activePreset.recommendedTestProbe!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Sample Test</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean 4-Part Picker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md">
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
              className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors z-10 ${
                isActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="builderSubStepIndicator"
                  className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate">
                  {meta.num} {meta.label}
                </div>
                <div className="text-[10px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400 truncate">
                  {meta.subprocessTag} · {progress.filled}/{progress.total}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Focused Editor Card */}
      <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xs">
        <div className="pb-5 mb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {currentMeta.num}. {currentMeta.label}
              <span className="ml-2 text-xs font-mono font-normal text-indigo-600 dark:text-indigo-400">
                · {currentMeta.subprocessTag}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {currentMeta.summary}
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400 shrink-0">
            {currentProgress.filled} of {currentProgress.total} boxes filled
          </span>
        </div>

        {/* Sub-Step 1.1: Main Goal */}
        {activeSection === 'role' && (
          <div className="space-y-6">
            <FieldWithGuidance
              label="Main Goal"
              hint="Write in 1–2 short sentences what this setup does and what problem it solves."
              whyItMatters="Keeps the builder focused so later rules never drift away from your goal."
              exampleText="Check code updates for safety bugs and suggest 1 small fix using simple 5th-grade words."
              value={inputs.roleObjectives.primaryObjective}
              onChange={(v) => updateField('roleObjectives', 'primaryObjective', v)}
              placeholder="e.g. Check numbers and code updates safely and point out exact mistakes..."
              rows={2}
            />

            <FieldWithGuidance
              label="Daily Tasks"
              hint="List the exact jobs the system runs on each message."
              whyItMatters="Turns loose wishes into a clear step-by-step checklist."
              exampleText="1. Read the input numbers or code; 2. Check safety limits; 3. Verify math equations; 4. Show 1 small fix."
              value={inputs.roleObjectives.primaryTasks}
              onChange={(v) => updateField('roleObjectives', 'primaryTasks', v)}
              placeholder="e.g. 1. Read input, 2. Check safety rules, 3. Verify math..."
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Final Output"
                hint="Name the exact result returned (short report, SQL, JSON, table)."
                whyItMatters="Stops chatty filler when you need a clean report or table."
                exampleText="Short Markdown report listing line numbers, risk level, and 1 small fix."
                value={inputs.roleObjectives.finalOutputs}
                onChange={(v) => updateField('roleObjectives', 'finalOutputs', v)}
                placeholder="e.g. Short report with exact math and 1 safe fix..."
                rows={3}
              />

              <FieldWithGuidance
                label="How to Know It Passed"
                hint="Write clear pass/fail numbers or rules (zero guesses, exact math, simple words)."
                whyItMatters="Gives Step 3 Check clear pass marks to score against."
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
                label="Safe Limits (What Is In Scope)"
                hint="Say what files, numbers, or rules the system may read—and nothing else."
                whyItMatters="Stops the AI from guessing about missing files or running outside safe folders."
                exampleText="Work only on the numbers and files given. Give 0% power to personal stories or personal roles."
                value={inputs.systemArchitecture.operationalBoundaries}
                onChange={(v) => updateField('systemArchitecture', 'operationalBoundaries', v)}
                placeholder="e.g. Read-only on given files; zero guessing..."
                rows={3}
              />

              <FieldWithGuidance
                label='Hard "Never Do" Rules'
                hint="Write strict stop rules and no-loop locks that tricks cannot turn off."
                whyItMatters="Blocks repeating auto-fix loops, prompt tricks, and fake proven claims."
                exampleText="Never loop auto-edits on code or logic (max_auto_adjust_loops = 0). Never mark unrun code as Verified."
                value={inputs.systemArchitecture.executionConstraints}
                onChange={(v) => updateField('systemArchitecture', 'executionConstraints', v)}
                placeholder="e.g. Never run auto-loops or edit files without asking (y/N)..."
                rows={3}
              />
            </div>

            <FieldWithGuidance
              label="Step Order"
              hint="Write the step-by-step order from reading input to sending the answer."
              whyItMatters="Makes sure power, safety, and math checks run before any answer is written."
              exampleText="1. SP-01 Power & Goal -> 2. SP-02 Limits & No-Loop -> 3. SP-03 Math & Proof -> 4. SP-04 Person Gate."
              value={inputs.systemArchitecture.workflowSequence}
              onChange={(v) => updateField('systemArchitecture', 'workflowSequence', v)}
              placeholder="e.g. 1. Check goal -> 2. Check limits -> 3. Check math -> 4. Send answer..."
              rows={2}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Allowed Tools & AI Commands"
                hint="List the exact one-pass commands allowed to run."
                whyItMatters="Limits what the engine can run so every action stays safe."
                exampleText="Allowed AI commands only: cmd:triage_resource, cmd:search_evidence, cmd:verify_claim, cmd:propose_single_patch, cmd:escalate_human_gate."
                value={inputs.systemArchitecture.toolUsePolicies}
                onChange={(v) => updateField('systemArchitecture', 'toolUsePolicies', v)}
                placeholder="e.g. cmd:search_evidence and cmd:verify_claim only..."
                rows={2}
              />

              <FieldWithGuidance
                label="Stop Rules for Bad Input"
                hint="Say what happens when input is broken, math is wrong, or an auto-loop is asked."
                whyItMatters="Stops wild AI guessing when messy or tricky input arrives."
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
              label="Checking Skills & Methods"
              hint="Name the checking skills or math rules the setup uses."
              whyItMatters="Makes answers concrete and step-by-step instead of vague advice."
              exampleText="Math equation checks, safe SQL checks, folder path rules, and 4-level claim checks."
              value={inputs.domainExpertise.technicalCapabilities}
              onChange={(v) => updateField('domainExpertise', 'technicalCapabilities', v)}
              placeholder="e.g. Math checks, file reading, SQL safety..."
              rows={3}
            />

            <FieldWithGuidance
              label="Trusted Guides & Files"
              hint="Name the official guides or config files to follow."
              whyItMatters="Keeps answers anchored to real docs instead of made-up names."
              exampleText="Official TypeScript guide, SQL safety list, and .config/duxcmd.json."
              value={inputs.domainExpertise.knowledgeBases}
              onChange={(v) => updateField('domainExpertise', 'knowledgeBases', v)}
              placeholder="e.g. Official Python guide, company policy file..."
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldWithGuidance
                label="Safety & Word Standards"
                hint="Name safety rules and simple 5th-grade language standards."
                whyItMatters="Makes sure complex words get swapped or marked [REDACTED]."
                exampleText="Simple 5th-grade words only; redact hard unknown words as [REDACTED]. Follow Zero Trust folder rules."
                value={inputs.domainExpertise.referenceStandards}
                onChange={(v) => updateField('domainExpertise', 'referenceStandards', v)}
                placeholder="e.g. Simple 5th-grade words only, Zero Trust folder locks..."
                rows={2}
              />

              <FieldWithGuidance
                label="Labels & Formatting Rules"
                hint="Name exact tags for dates, math, and proof levels."
                whyItMatters="Keeps every answer matching the same clean format."
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
                hint="Describe the calm, clear tone to use."
                whyItMatters="Replaces chatty AI filler with simple, direct facts."
                exampleText="Calm Fact Checker: short, direct 5th-grade words, zero small talk."
                value={inputs.personaInteraction.toneAndVoice}
                onChange={(v) => updateField('personaInteraction', 'toneAndVoice', v)}
                placeholder="e.g. Calm, direct, 5th-grade words only..."
                rows={3}
              />

              <FieldWithGuidance
                label="Shortness & Clarity Rules"
                hint="Say how short sentences should be and ban AI guessing phrases."
                whyItMatters="Keeps extra fluff below 5% in Step 3 Check."
                exampleText="Short bullet points in plain 5th-grade words. Never say 'I think', 'probably', or 'it seems'."
                value={inputs.personaInteraction.communicationRegister}
                onChange={(v) => updateField('personaInteraction', 'communicationRegister', v)}
                placeholder="e.g. Short clear bullets; zero guesses..."
                rows={3}
              />
            </div>

            <FieldWithGuidance
              label="Banned Words & Fluff"
              hint="List filler openings, guesses, or hard words that are banned."
              whyItMatters="Clear negative word lists keep unwanted small talk out."
              exampleText="Banned: 'Certainly!', 'Hope this helps!', 'As an AI', 'I think', 'It seems to work'."
              value={inputs.personaInteraction.forbiddenPhrasing}
              onChange={(v) => updateField('personaInteraction', 'forbiddenPhrasing', v)}
              placeholder="e.g. 'Certainly!', 'As an AI', 'Hope this helps!'..."
              rows={2}
            />

            <FieldWithGuidance
              label="Output Shape"
              hint="Show the exact headings, table columns, or JSON shape to print."
              whyItMatters="Makes sure every reply looks clean and matches your layout."
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
              ? `${currentProgress.filled} of ${currentProgress.total} boxes filled here. Next: ${SECTION_META[nextSection].num} ${SECTION_META[nextSection].label}.`
              : `${totalPillarsWithContent} of 4 parts filled. Click Build Rules to unlock Step 2 Compare.`
          }
          isStepComplete={currentProgress.filled >= Math.max(1, Math.ceil(currentProgress.total / 2))}
          backLabel={prevSection ? `Back to ${SECTION_META[prevSection].num}` : undefined}
          onBack={prevSection ? () => setActiveSection(prevSection) : undefined}
          secondaryAction={
            nextSection
              ? {
                  label: hasOptimizedResult ? 'Go to Step 2' : 'Build Rules Now',
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
              : 'Build Rules & Go to Step 2'
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

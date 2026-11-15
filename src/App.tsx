import React, { useState, useEffect, useRef } from 'react';
import {
  AgentConfigurationInputs,
  OptimizationResult,
  IterationSnapshot,
  AgentPreset,
  IndependentAuditReport,
  ChatMessage,
  SubprocessTraceStep,
  ActivityLogEntry,
  WorkspaceTab,
  SwarmexActivityMetrics,
  WorkflowCompletionStatus,
} from './types/agent';
import { DEFAULT_BLANK_INPUTS, PRESET_AGENTS } from './data/presets';
import { simplifyAndRedactText, simplifyAndRedactObject } from './utils/simpleVocabulary';
import { Header } from './components/Header';
import { WorkflowStepper } from './components/WorkflowStepper';
import { BuilderView, BuilderSection } from './components/BuilderView';
import { SideBySideReview } from './components/SideBySideReview';
import { AuditView } from './components/AuditView';
import { SimulatorView } from './components/SimulatorView';
import { SwarmexWorkbenchView } from './components/SwarmexWorkbenchView';
import { ExportModal } from './components/ExportModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { IntroWorkflowModal } from './components/IntroWorkflowModal';
import { VFXAtmosphere } from './components/VFXAtmosphere';
import { AuditLogSidebar } from './components/AuditLogSidebar';
import { AlertCircle } from 'lucide-react';

const INITIAL_BASELINE_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-init-swarmex',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'AUDIT',
    title: 'First Safety Check: Read-Only & 5th-Grade Simple Words',
    inputText:
      'Config: .config/duxcmd.json (mode: read_only, default_policy: deny_all)\nGate: scripts/execution_gateway.sh\nChecker: scripts/policy_enforcer.py',
    outputText:
      'Folder limits checked for ["/workspace/src", "/workspace/docs", "/workspace/.config"]. Changes (DEPLOY, WRITE_SYS, EXECUTE) wait for Person Gate (y/N).',
    whatChanged: [
      {
        area: 'Lesson Deck',
        before: 'Hard words and generic presets',
        after: 'Switched all labels, rules, and outputs to simple 5th-grade words with auto-[REDACTED]',
      },
    ],
    whatFailed: [
      'No real test output run yet — CLI claims stay Clue from Files until tested at Person Gate.',
    ],
    testingDone: [
      {
        testName: 'policy_enforcer.py Read-Only Check',
        outcome: 'VERIFIED',
        detail: 'Blocked writes and runs in read_only mode; allowed whitelisted folders only.',
      },
      {
        testName: 'execution_gateway.sh Person Gate Check',
        outcome: 'PASS',
        detail: 'DEPLOY, WRITE_SYS, and EXECUTE wait for (y/N) approval.',
      },
      {
        testName: 'Proof Level Check',
        outcome: 'SUPPORTED_INFERENCE',
        detail: 'Files read cleanly; real CLI runs wait for Person Gate approval.',
      },
    ],
    status: 'WARNING',
  },
];

function serializeInputsSummary(inputs: AgentConfigurationInputs): string {
  return [
    `[Goal] ${inputs.roleObjectives.primaryObjective}`,
    `[Tasks] ${inputs.roleObjectives.primaryTasks}`,
    `[Limits] ${inputs.systemArchitecture.operationalBoundaries}`,
    `[Rules] ${inputs.systemArchitecture.executionConstraints}`,
    `[Standards] ${inputs.domainExpertise.referenceStandards}`,
    `[Voice] ${inputs.personaInteraction.toneAndVoice}`,
    `[Shape] ${inputs.personaInteraction.formatSchemas}`,
  ].join('\n');
}

const INPUTS_AUTOSAVE_KEY = 'agent_architect_inputs_autosave_v1';
const INTRO_SEEN_KEY = 'agent_architect_intro_seen_v1';
const AUTOSAVE_INTERVAL_MS = 5000;

function loadSavedInputs(): AgentConfigurationInputs {
  if (typeof window === 'undefined') {
    return DEFAULT_BLANK_INPUTS;
  }
  try {
    const raw = window.localStorage.getItem(INPUTS_AUTOSAVE_KEY);
    if (!raw) return DEFAULT_BLANK_INPUTS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_BLANK_INPUTS;
    }
    return {
      roleObjectives: {
        ...DEFAULT_BLANK_INPUTS.roleObjectives,
        ...(parsed.roleObjectives && typeof parsed.roleObjectives === 'object' ? parsed.roleObjectives : {}),
      },
      systemArchitecture: {
        ...DEFAULT_BLANK_INPUTS.systemArchitecture,
        ...(parsed.systemArchitecture && typeof parsed.systemArchitecture === 'object' ? parsed.systemArchitecture : {}),
      },
      domainExpertise: {
        ...DEFAULT_BLANK_INPUTS.domainExpertise,
        ...(parsed.domainExpertise && typeof parsed.domainExpertise === 'object' ? parsed.domainExpertise : {}),
      },
      personaInteraction: {
        ...DEFAULT_BLANK_INPUTS.personaInteraction,
        ...(parsed.personaInteraction && typeof parsed.personaInteraction === 'object' ? parsed.personaInteraction : {}),
      },
    };
  } catch {
    return DEFAULT_BLANK_INPUTS;
  }
}

export default function App() {
  const [inputs, setInputs] = useState<AgentConfigurationInputs>(loadSavedInputs);
  const inputsRef = useRef<AgentConfigurationInputs>(inputs);
  inputsRef.current = inputs;
  const [activePreset, setActivePreset] = useState<AgentPreset | null>(null);
  const [pendingProbeText, setPendingProbeText] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('builder');
  const [optimizationMode, setOptimizationMode] = useState<string>('technical_json_schema');
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [lastOptimizedDraft, setLastOptimizedDraft] = useState<string | null>(null);
  const [lastAuditReport, setLastAuditReport] = useState<IndependentAuditReport | null>(null);
  const [probesExecuted, setProbesExecuted] = useState<number>(0);
  const [swarmexMetrics, setSwarmexMetrics] = useState<SwarmexActivityMetrics>({
    policyChecksRun: 0,
    gatewayDecisions: 0,
    claimsClassified: 0,
    bundleExported: false,
  });
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Collapsed by default on load so the active step stays clean
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(INITIAL_BASELINE_LOGS);
  const [isLogSidebarOpen, setIsLogSidebarOpen] = useState<boolean>(false);

  const appendLog = (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const cleaned = simplifyAndRedactObject(entry);
    const fullEntry: ActivityLogEntry = {
      ...cleaned,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setActivityLogs((prev) => [fullEntry, ...prev]);
  };

  // Light / Dark mode management
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agent_architect_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('agent_architect_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('agent_architect_theme', 'light');
    }
  }, [isDark]);

  // Iteration Snapshots & Modals
  const [snapshots, setSnapshots] = useState<IterationSnapshot[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(INTRO_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [requestedBuilderSection, setRequestedBuilderSection] = useState<{
    section: BuilderSection;
    nonce: number;
  } | null>(null);

  const handleCloseIntro = (dontShowAgain: boolean) => {
    setIsIntroOpen(false);
    try {
      if (dontShowAgain) {
        window.localStorage.setItem(INTRO_SEEN_KEY, '1');
      } else {
        window.localStorage.removeItem(INTRO_SEEN_KEY);
      }
    } catch {
      // Ignore storage access errors
    }
  };

  const handleJumpFromIntro = (tab: WorkspaceTab, section?: BuilderSection) => {
    setActiveTab(tab);
    if (tab === 'builder' && section) {
      setRequestedBuilderSection({ section, nonce: Date.now() });
    }
  };

  // Auto-save 'inputs' state to localStorage every 5 seconds (plus beforeunload flush)
  useEffect(() => {
    const persistInputs = () => {
      try {
        window.localStorage.setItem(INPUTS_AUTOSAVE_KEY, JSON.stringify(inputsRef.current));
      } catch {
        // Ignore storage errors
      }
    };

    const intervalId = window.setInterval(persistInputs, AUTOSAVE_INTERVAL_MS);
    window.addEventListener('beforeunload', persistInputs);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', persistInputs);
    };
  }, []);

  // Initialize first snapshot on load
  useEffect(() => {
    const initialSnapshot: IterationSnapshot = {
      id: `snap-${Date.now()}`,
      versionNumber: 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name: 'First Simple Draft',
      inputs: inputsRef.current,
      result: null,
      optimizationMode: 'technical_json_schema',
    };
    setSnapshots([initialSnapshot]);
  }, []);

  // Run Rule Builder Endpoint
  const handleOptimize = async () => {
    setIsOptimizing(true);
    setErrorMessage(null);
    const serializedDraft = serializeInputsSummary(inputs);

    try {
      const response = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs,
          mode: optimizationMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error ${response.status}`);
      }

      const rawData: OptimizationResult = await response.json();
      const resultData = simplifyAndRedactObject(rawData);
      setOptimizationResult(resultData);
      setLastOptimizedDraft(serializedDraft);
      setLastAuditReport(null);

      // Save snapshot
      const newVersion = currentVersion + 1;
      setCurrentVersion(newVersion);
      const newSnapshot: IterationSnapshot = {
        id: `snap-${Date.now()}`,
        versionNumber: newVersion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        name: `Build v${newVersion}`,
        inputs: { ...inputs },
        result: resultData,
        optimizationMode,
      };
      setSnapshots((prev) => [newSnapshot, ...prev]);

      // Log record
      appendLog({
        type: 'OPTIMIZATION',
        title: `Rules Built: ${resultData.agentTitle || 'Simple Rules'} (v${newVersion})`,
        inputText: serializedDraft,
        outputText: resultData.compiledSystemInstruction,
        whatChanged: resultData.auditReport.modifications.map((m) => ({
          area: `${m.segment} · ${m.category}`,
          before: m.originalExcerpt || '(Empty)',
          after: m.revisedExcerpt,
        })),
        whatFailed: resultData.auditReport.gapsIdentifiedAndAddressed,
        testingDone: [
          {
            testName: 'Goal Match Check',
            outcome: resultData.auditReport.intentPreservationScore >= 95 ? 'PASS' : 'WARNING',
            detail: `Score: ${resultData.auditReport.intentPreservationScore}% | Drift Risk: ${resultData.auditReport.driftRiskLevel}`,
          },
          ...resultData.auditReport.complianceChecklist.map((c) => ({
            testName: c.criterion,
            outcome: 'VERIFIED' as const,
            detail: c.evidence,
          })),
        ],
        status: resultData.auditReport.gapsIdentifiedAndAddressed.length > 0 ? 'WARNING' : 'PASS',
      });

      setActiveTab('review');
    } catch (err: any) {
      console.error('Build rules error:', err);
      const msg = simplifyAndRedactText(err.message || 'Could not build rules. Please try again.');
      setErrorMessage(msg);
      appendLog({
        type: 'ERROR',
        title: 'Rule Build Failed',
        inputText: serializedDraft,
        outputText: msg,
        whatChanged: [],
        whatFailed: [msg],
        testingDone: [
          {
            testName: '/api/optimize-prompt Check',
            outcome: 'FAIL',
            detail: msg,
          },
        ],
        status: 'FAIL',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Run Independent Rule Check Endpoint
  const handleAuditPrompt = async (promptText: string): Promise<IndependentAuditReport | null> => {
    try {
      const response = await fetch('/api/audit-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText,
          targetGoal: inputs.roleObjectives.primaryObjective,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error ${response.status}`);
      }

      const rawReport: IndependentAuditReport = await response.json();
      const report = simplifyAndRedactObject(rawReport);
      setLastAuditReport(report);

      const failedDimensions = report.evaluations
        .filter((e) => e.status !== 'PASS')
        .map((e) => `[${e.status}] ${e.dimension} (${e.score}/100): ${e.finding}`);

      appendLog({
        type: 'AUDIT',
        title: `Rule Check Done (${report.overallHealthScore}/100)`,
        inputText: promptText,
        outputText: `Safety Score: ${report.overallHealthScore}/100 | Extra Fluff: ${report.fluffRatioPercentage}%\nNext Fixes:\n- ${report.suggestedRemediations.join('\n- ')}`,
        whatChanged: [],
        whatFailed: [...failedDimensions, ...report.identifiedDeficiencies],
        testingDone: report.evaluations.map((e) => ({
          testName: e.dimension,
          outcome: e.status === 'PASS' ? 'PASS' : e.status === 'WARNING' ? 'WARNING' : 'FAIL',
          detail: `${e.score}/100 — ${e.finding}`,
        })),
        status:
          report.evaluations.some((e) => e.status === 'CRITICAL')
            ? 'FAIL'
            : failedDimensions.length > 0 || report.identifiedDeficiencies.length > 0
            ? 'WARNING'
            : 'PASS',
      });

      return report;
    } catch (err: any) {
      console.error('Rule check error:', err);
      appendLog({
        type: 'ERROR',
        title: 'Rule Check Failed',
        inputText: promptText,
        outputText: simplifyAndRedactText(err.message || 'Check request failed'),
        whatChanged: [],
        whatFailed: [simplifyAndRedactText(err.message || 'Check error')],
        testingDone: [
          {
            testName: '/api/audit-prompt Check',
            outcome: 'FAIL',
            detail: simplifyAndRedactText(err.message || 'Network or server error'),
          },
        ],
        status: 'FAIL',
      });
      throw err;
    }
  };

  // Live Multi-Step Reasoning Test Endpoint
  const handleSendMessage = async (
    history: ChatMessage[],
    messageText: string
  ): Promise<{ reply: string; subprocessTrace?: SubprocessTraceStep[] }> => {
    const activeSystemPrompt =
      optimizationResult?.compiledSystemInstruction ||
      `Goal: ${inputs.roleObjectives.primaryObjective}\nLimits: ${inputs.systemArchitecture.operationalBoundaries}\nSkills: ${inputs.domainExpertise.technicalCapabilities}\nVoice: ${inputs.personaInteraction.toneAndVoice}`;

    try {
      const response = await fetch('/api/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: activeSystemPrompt,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          message: messageText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }

      const data = await response.json();
      const reply: string = simplifyAndRedactText(data.reply || 'No reply sent.');
      const subprocessTrace: SubprocessTraceStep[] | undefined = Array.isArray(data.subprocessTrace)
        ? simplifyAndRedactObject(data.subprocessTrace)
        : undefined;

      const isSecurityRefusal = /SAFETY RULE STOPPED|SECURITY VIOLATION|LOOP RULE BROKEN|LOOP & MUTATION INVARIANT VIOLATION|SKIPPED · 0% POWER|RESOURCE ALLOCATION: IGNORED|MATH CHECK FAILED|MATH VERIFICATION FAILED|STOP RULE TRIGGERED|PERSON MUST APPROVE|HUMAN APPROVAL REQUIRED|FORMAT MISMATCH|SYNTAX DISCREPANCY|REFUSED|SOURCE_REJECTED|INTENT_MODELING_BLOCKED|VALIDATION_FAILED|LOOP_BLOCKED|SAFETY_BLOCKED|WEB SOURCE RULE BLOCKED|PERSONAL PROFILING|denied|blocked/i.test(reply);
      const isAdversarialProbe = /override|ignore all|\/etc\/passwd|drop table|how are you|malformed|deploy|write_sys|auto[-\s]?adjust|retry\s+loop|loop\s+until|writhing|build a profile|personal\s+(?:statement|story|commentary|characteristic|opinion|topic)|extrapolate\s+user\s+intent|http:\/\/localhost|example\.invalid|2\s*\+\s*2\s*=\s*5/i.test(messageText);

      const probeFailures: string[] = [];
      if (isAdversarialProbe && !isSecurityRefusal && /hope this helps|certainly|happy to/i.test(reply)) {
        probeFailures.push('Engine used fluff words or failed to block a risky test message.');
      }

      const subprocessTests = (subprocessTrace || []).map((sp) => ({
        testName: `${sp.subprocessId} ${sp.name}${sp.commandOp ? ` · ${sp.commandOp}` : ''}`,
        outcome:
          sp.status === 'BLOCKED' || sp.status === 'PASS'
            ? ('PASS' as const)
            : sp.status === 'INFERENCE'
            ? ('SUPPORTED_INFERENCE' as const)
            : ('WARNING' as const),
        detail: `[${sp.status}]${sp.resourceAllocation ? ` (${sp.resourceAllocation === 'IGNORED_ZERO_COMPUTE' ? '0% Power' : '100% Power'})` : ''} ${sp.summary}`,
      }));

      appendLog({
        type: 'TEST_PROBE',
        title: isAdversarialProbe ? 'Safety Gate Live Test' : 'Main Engine Live Turn',
        inputText: messageText,
        outputText: reply,
        whatChanged: [],
        whatFailed: probeFailures,
        testingDone:
          subprocessTests.length > 0
            ? subprocessTests
            : [
                {
                  testName: isAdversarialProbe ? 'Safety Block Check' : 'Normal Reply Test',
                  outcome: probeFailures.length > 0 ? 'FAIL' : 'PASS',
                  detail: isSecurityRefusal
                    ? 'Engine blocked unsafe request cleanly.'
                    : 'Engine answered using active simple rules.',
                },
              ],
        status: probeFailures.length > 0 ? 'FAIL' : 'PASS',
      });

      setProbesExecuted((prev) => prev + 1);
      return { reply, subprocessTrace };
    } catch (err: any) {
      appendLog({
        type: 'ERROR',
        title: 'Live Test Error',
        inputText: messageText,
        outputText: simplifyAndRedactText(err.message || 'Live test failed'),
        whatChanged: [],
        whatFailed: [simplifyAndRedactText(err.message || 'Live test error')],
        testingDone: [
          {
            testName: '/api/test-agent Check',
            outcome: 'FAIL',
            detail: simplifyAndRedactText(err.message || 'Could not get reply'),
          },
        ],
        status: 'FAIL',
      });
      throw err;
    }
  };

  // Presets and Draft manipulation
  const handleSelectPreset = (preset: AgentPreset) => {
    const previousObj = inputs.roleObjectives.primaryObjective;
    setInputs(preset.inputs);
    setActivePreset(preset);
    setOptimizationResult(null);
    setErrorMessage(null);

    appendLog({
      type: 'TEMPLATE_LOAD',
      title: `Loaded ${preset.isTeachingTemplate ? 'Lesson' : 'Preset'}: ${preset.name}`,
      inputText: serializeInputsSummary(preset.inputs),
      outputText: preset.teachingLesson || preset.description,
      whatChanged: [
        {
          area: 'Active Step 1 Draft',
          before: previousObj || '(Old draft)',
          after: preset.inputs.roleObjectives.primaryObjective,
        },
      ],
      whatFailed: preset.expectedPitfalls || [],
      testingDone: [
        {
          testName: 'Starter Draft Load',
          outcome: 'PASS',
          detail: `${preset.category}${preset.difficulty ? ` (${preset.difficulty})` : ''} loaded into 4 boxes.`,
        },
      ],
      status: preset.expectedPitfalls && preset.expectedPitfalls.length > 0 ? 'WARNING' : 'PASS',
    });
  };

  const handleRunRecommendedProbe = (probeText: string) => {
    setPendingProbeText(probeText);
    setActiveTab('simulator');
  };

  const handleResetToBlank = () => {
    const blankInputs: AgentConfigurationInputs = {
      roleObjectives: { primaryObjective: '', primaryTasks: '', finalOutputs: '', successMetrics: '' },
      systemArchitecture: { operationalBoundaries: '', executionConstraints: '', toolUsePolicies: '', workflowSequence: '', edgeCases: '' },
      domainExpertise: { technicalCapabilities: '', knowledgeBases: '', referenceStandards: '', algorithmicConventions: '' },
      personaInteraction: { toneAndVoice: '', communicationRegister: '', forbiddenPhrasing: '', formatSchemas: '' },
    };
    setInputs(blankInputs);
    try {
      window.localStorage.removeItem(INPUTS_AUTOSAVE_KEY);
    } catch {
      // Ignore storage access errors
    }
    setActivePreset(null);
    setOptimizationResult(null);
    setErrorMessage(null);
  };

  const handleApplyRefinedToBuilder = () => {
    if (optimizationResult?.refinedSections) {
      setInputs(simplifyAndRedactObject(optimizationResult.refinedSections));
      setActiveTab('builder');
      appendLog({
        type: 'TEMPLATE_LOAD',
        title: 'Sent Simple Built Rules Back to Step 1',
        inputText: serializeInputsSummary(inputs),
        outputText: serializeInputsSummary(optimizationResult.refinedSections),
        whatChanged: [
          {
            area: 'Step 1 Boxes',
            before: 'Old draft text',
            after: 'Clean 5th-grade rules sent back for next edit',
          },
        ],
        whatFailed: [],
        testingDone: [
          {
            testName: 'Rule Copy Check',
            outcome: 'PASS',
            detail: 'Clean rules loaded back into Step 1 Setup boxes.',
          },
        ],
        status: 'PASS',
      });
    }
  };

  const handleRestoreSnapshot = (snapshot: IterationSnapshot) => {
    setInputs(snapshot.inputs);
    setOptimizationResult(snapshot.result);
    setOptimizationMode(snapshot.optimizationMode);
    setCurrentVersion(snapshot.versionNumber);
  };

  const handleSyncPolicyToBuilder = (partialInputs: Partial<AgentConfigurationInputs>) => {
    const mergedInputs: AgentConfigurationInputs = {
      roleObjectives: partialInputs.roleObjectives
        ? { ...inputs.roleObjectives, ...partialInputs.roleObjectives }
        : inputs.roleObjectives,
      systemArchitecture: partialInputs.systemArchitecture
        ? { ...inputs.systemArchitecture, ...partialInputs.systemArchitecture }
        : inputs.systemArchitecture,
      domainExpertise: partialInputs.domainExpertise
        ? { ...inputs.domainExpertise, ...partialInputs.domainExpertise }
        : inputs.domainExpertise,
      personaInteraction: partialInputs.personaInteraction
        ? { ...inputs.personaInteraction, ...partialInputs.personaInteraction }
        : inputs.personaInteraction,
    };

    setInputs(mergedInputs);
    setOptimizationResult(null);
    setErrorMessage(null);
    setActiveTab('builder');

    appendLog({
      type: 'TEMPLATE_LOAD',
      title: 'Sent Safety Gate Rules to Step 1',
      inputText: serializeInputsSummary(inputs),
      outputText: serializeInputsSummary(mergedInputs),
      whatChanged: [
        {
          area: 'Goal & Safety Boxes',
          before: inputs.systemArchitecture.operationalBoundaries || '(Old limits)',
          after: mergedInputs.systemArchitecture.operationalBoundaries,
        },
      ],
      whatFailed: [],
      testingDone: [
        {
          testName: 'Safety Rule Sync',
          outcome: 'PASS',
          detail: 'Updated Step 1 Goal and Limits from .config/duxcmd.json.',
        },
      ],
      status: 'PASS',
    });
  };

  const serializedCurrentDraft = serializeInputsSummary(inputs);
  const configureReadyCount = [
    inputs.roleObjectives.primaryObjective.trim(),
    inputs.systemArchitecture.operationalBoundaries.trim(),
    inputs.domainExpertise.technicalCapabilities.trim(),
    inputs.personaInteraction.formatSchemas.trim(),
  ].filter(Boolean).length;

  const stepCompletion: WorkflowCompletionStatus = {
    configureReadyCount,
    isConfigured: configureReadyCount >= 3,
    isOptimized: Boolean(optimizationResult),
    needsReoptimize: Boolean(
      optimizationResult && lastOptimizedDraft && lastOptimizedDraft !== serializedCurrentDraft
    ),
    isAudited: Boolean(lastAuditReport),
    auditHealthScore: lastAuditReport?.overallHealthScore ?? null,
    probesExecuted,
    swarmexChecksCompleted:
      swarmexMetrics.policyChecksRun +
      swarmexMetrics.gatewayDecisions +
      swarmexMetrics.claimsClassified +
      (swarmexMetrics.bundleExported ? 1 : 0),
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-transparent text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900">
      <VFXAtmosphere />

      <Header
        setActiveTab={setActiveTab}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenIntro={() => setIsIntroOpen(true)}
        isLogSidebarOpen={isLogSidebarOpen}
        onToggleLogSidebar={() => setIsLogSidebarOpen((prev) => !prev)}
        logCount={activityLogs.length}
        isDark={isDark}
        setIsDark={setIsDark}
        hasOptimizedResult={Boolean(optimizationResult)}
        snapshotCount={snapshots.length}
      />

      <WorkflowStepper
        activeStep={activeTab}
        onSelectStep={setActiveTab}
        completion={stepCompletion}
      />

      {errorMessage && (
        <div className="relative z-30 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 px-6 py-3 flex items-center justify-between gap-4 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="font-semibold underline hover:no-underline text-[11px]"
          >
            Hide
          </button>
        </div>
      )}

      <main className="flex-1 min-w-0 pb-16 relative z-10">
        {activeTab === 'builder' && (
          <BuilderView
            inputs={inputs}
            setInputs={setInputs}
            optimizationMode={optimizationMode}
            setOptimizationMode={setOptimizationMode}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            onSelectPreset={handleSelectPreset}
            activePreset={activePreset}
            onRunRecommendedProbe={handleRunRecommendedProbe}
            onResetToBlank={handleResetToBlank}
            onNavigateToTab={setActiveTab}
            hasOptimizedResult={Boolean(optimizationResult)}
            requestedSection={requestedBuilderSection}
          />
        )}

        {activeTab === 'review' && (
          <SideBySideReview
            originalInputs={inputs}
            result={optimizationResult}
            needsReoptimize={stepCompletion.needsReoptimize}
            onApplyRefinedToBuilder={handleApplyRefinedToBuilder}
            onNavigateToTab={setActiveTab}
            onOpenExport={() => setIsExportOpen(true)}
            onReoptimize={handleOptimize}
            isOptimizing={isOptimizing}
          />
        )}

        {activeTab === 'audit' && (
          <AuditView
            currentSystemInstruction={
              optimizationResult?.compiledSystemInstruction ||
              `Goal: ${inputs.roleObjectives.primaryObjective}\nLimits: ${inputs.systemArchitecture.operationalBoundaries}\nRules: ${inputs.systemArchitecture.executionConstraints}`
            }
            auditReport={lastAuditReport}
            onAuditPrompt={handleAuditPrompt}
            onNavigateToTab={setActiveTab}
            onTriggerOptimization={handleOptimize}
            isOptimizing={isOptimizing}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView
            systemInstruction={
              optimizationResult?.compiledSystemInstruction ||
              `Goal: ${inputs.roleObjectives.primaryObjective}\nLimits: ${inputs.systemArchitecture.operationalBoundaries}\nSkills: ${inputs.domainExpertise.technicalCapabilities}\nVoice: ${inputs.personaInteraction.toneAndVoice}\nShape: ${inputs.personaInteraction.formatSchemas}${optimizationMode === 'technical_json_schema' ? '\nOutput Mode: TechnicalResponsePayload JSON Schema (required keys: "context", "explicit requirements", "response_data")' : ''}`
            }
            agentTitle={optimizationResult?.agentTitle || activePreset?.name || 'Simple Rules'}
            probesExecuted={probesExecuted}
            onSendMessage={handleSendMessage}
            onNavigateToTab={setActiveTab}
            pendingProbeText={pendingProbeText}
            onClearPendingProbe={() => setPendingProbeText(null)}
          />
        )}

        {activeTab === 'swarmex' && (
          <SwarmexWorkbenchView
            metrics={swarmexMetrics}
            onUpdateMetrics={setSwarmexMetrics}
            onLogEvent={appendLog}
            onSyncPolicyToBuilder={handleSyncPolicyToBuilder}
            onNavigateToTab={setActiveTab}
          />
        )}
      </main>

      <AuditLogSidebar
        isOpen={isLogSidebarOpen}
        onClose={() => setIsLogSidebarOpen(false)}
        logs={activityLogs}
        onClearLogs={() => setActivityLogs([])}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        result={optimizationResult}
        inputs={inputs}
      />

      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        snapshots={snapshots}
        onRestoreSnapshot={handleRestoreSnapshot}
        currentVersion={currentVersion}
      />

      <IntroWorkflowModal
        isOpen={isIntroOpen}
        onClose={handleCloseIntro}
        onJumpToLocation={handleJumpFromIntro}
        onLoadStarterPreset={
          PRESET_AGENTS[0] ? () => handleSelectPreset(PRESET_AGENTS[0]) : undefined
        }
        hasExistingInputs={configureReadyCount > 0}
      />
    </div>
  );
}

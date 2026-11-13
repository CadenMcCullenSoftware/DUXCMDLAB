import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  DuxcmdPolicyConfig,
  ActivityLogEntry,
  AgentConfigurationInputs,
  SwarmexActivityMetrics,
  WorkspaceTab,
} from '../types/agent';
import {
  DEFAULT_DUXCMD_POLICY,
  validateDuxcmdAction,
  validateCommandOperation,
  classifyTechnicalClaim,
  classifyResourceAllocation,
  RESOURCE_ALLOCATION_TABLE,
  EVALUATION_STANDARDS_LIST,
  SWARMEX_FRAMEWORKS,
  SWARMEX_SAFEGUARDS,
  buildSwarmexRepoFiles,
  PolicyEvaluationOutcome,
  CommandOpEvaluationOutcome,
  ClaimEvaluationOutcome,
  ResourceAllocationOutcome,
} from '../data/swarmexPolicy';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import { StepHandoffBar } from './StepHandoffBar';
import { StepCompliancePanel } from './StepCompliancePanel';
import {
  ShieldCheck,
  Terminal,
  FileCode2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Download,
  RotateCcw,
  Lock,
  Scale,
  FolderTree,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SwarmexWorkbenchViewProps {
  metrics: SwarmexActivityMetrics;
  onUpdateMetrics: React.Dispatch<React.SetStateAction<SwarmexActivityMetrics>>;
  onLogEvent: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  onSyncPolicyToBuilder: (updatedInputs: Partial<AgentConfigurationInputs>) => void;
  onNavigateToTab: (tab: WorkspaceTab) => void;
}

type WorkbenchSubStep = 'validator' | 'gateway' | 'evidence' | 'repo';

const SUBSTEP_ORDER: WorkbenchSubStep[] = ['validator', 'gateway', 'evidence', 'repo'];

const SUBSTEP_META: Record<
  WorkbenchSubStep,
  { num: string; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }
> = {
  validator: {
    num: '5.1',
    label: 'Path & Loop Gate (SP-02)',
    hint: 'Test SP-02 read-only folder rules and no-loop command gates (.config/duxcmd.json).',
    icon: ShieldCheck,
  },
  gateway: {
    num: '5.2',
    label: 'Person Gate (SP-04)',
    hint: 'Test the SP-04 (y/N) person approval stop for DEPLOY, WRITE_SYS, and EXECUTE.',
    icon: Terminal,
  },
  evidence: {
    num: '5.3',
    label: 'Proof & Math Gate (SP-03)',
    hint: 'Sort claims into 4 proof levels and give 0% power to stories or wrong math.',
    icon: Scale,
  },
  repo: {
    num: '5.4',
    label: 'Starter Files',
    hint: 'Read the Python and Bash rule files and send limits back to Step 1.',
    icon: FolderTree,
  },
};

interface GatewayHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  params: string;
  outcome: 'APPROVED' | 'REJECTED';
  trace: string[];
}

export const SwarmexWorkbenchView: React.FC<SwarmexWorkbenchViewProps> = ({
  metrics,
  onUpdateMetrics,
  onLogEvent,
  onSyncPolicyToBuilder,
  onNavigateToTab,
}) => {
  const [subTab, setSubTab] = useState<WorkbenchSubStep>('validator');

  // 1. Live duxcmd.json configuration state
  const [policyConfig, setPolicyConfig] = useState<DuxcmdPolicyConfig>(DEFAULT_DUXCMD_POLICY);
  const [policyJsonText, setPolicyJsonText] = useState<string>(() =>
    JSON.stringify(DEFAULT_DUXCMD_POLICY, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Path & AI Command Gate State
  const [actionType, setActionType] = useState<'read' | 'write' | 'execute' | 'delete'>('read');
  const [targetPath, setTargetPath] = useState<string>('/workspace/src/agent.py');
  const [lastPolicyOutcome, setLastPolicyOutcome] = useState<PolicyEvaluationOutcome | null>(null);

  const [commandOpInput, setCommandOpInput] = useState<string>('cmd:propose_single_patch');
  const [commandDirectiveInput, setCommandDirectiveInput] = useState<string>(
    'Auto-adjust and rewrite logic in a retry loop until tests pass'
  );
  const [lastCommandOutcome, setLastCommandOutcome] = useState<CommandOpEvaluationOutcome | null>(null);

  // 2. Person Approval Gate State
  const [gatewayAction, setGatewayAction] = useState<string>('DEPLOY');
  const [gatewayParams, setGatewayParams] = useState<string>('--env=production --agent=duxcmd-researcher');
  const [pendingGatewayRequest, setPendingGatewayRequest] = useState<{
    action: string;
    params: string;
    trace: string[];
  } | null>(null);
  const [gatewayHistory, setGatewayHistory] = useState<GatewayHistoryItem[]>([]);

  // 3. Proof & Power Gate State
  const [claimText, setClaimText] = useState<string>('CLI runs inside safe box VM');
  const [evidenceText, setEvidenceText] = useState<string>(
    'Found config option isolation_level: strict_sandbox\nFound mode: read_only in .config/duxcmd.json'
  );
  const [claimOutcome, setClaimOutcome] = useState<ClaimEvaluationOutcome | null>(null);

  const [resourceInput, setResourceInput] = useState<string>(
    'Escrow account totals: $4,200, mortgage interest rates: 6.25%, tax returns: $95,000. Equation: 2 + 2 = 4.'
  );
  const [resourceOutcome, setResourceOutcome] = useState<ResourceAllocationOutcome | null>(null);

  // 4. Starter Files Viewer & Reference Drawer State
  const repoFiles = useMemo(() => buildSwarmexRepoFiles(policyConfig), [policyConfig]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('.config/duxcmd.json');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [showComplianceRef, setShowComplianceRef] = useState<boolean>(false);

  const selectedRepoFile =
    repoFiles.find((f) => f.path === selectedFilePath) || repoFiles[0];

  const handlePolicyJsonChange = (nextText: string) => {
    setPolicyJsonText(nextText);
    try {
      const parsed = JSON.parse(nextText);
      if (!parsed.agent || !parsed.permissions || !parsed.execution_environment) {
        setJsonError('Missing required Swarmex keys (agent, execution_environment, permissions).');
        return;
      }
      setJsonError(null);
      setPolicyConfig(parsed);
    } catch (err: any) {
      setJsonError(simplifyAndRedactText(err.message || 'Broken JSON format'));
    }
  };

  const handleToggleAgentMode = (newMode: 'read_only' | 'restricted_write' | 'elevated') => {
    const prevMode = policyConfig.agent.mode;
    const updated: DuxcmdPolicyConfig = {
      ...policyConfig,
      agent: {
        ...policyConfig.agent,
        mode: newMode,
      },
    };
    setPolicyConfig(updated);
    setPolicyJsonText(JSON.stringify(updated, null, 2));
    setJsonError(null);

    onLogEvent({
      type: 'TEMPLATE_LOAD',
      title: `Swarmex Mode Changed (${prevMode} -> ${newMode})`,
      inputText: `agent.mode = ${prevMode}`,
      outputText: `agent.mode = ${newMode}`,
      whatChanged: [
        {
          area: '.config/duxcmd.json · agent.mode',
          before: prevMode,
          after: newMode,
        },
      ],
      whatFailed:
        newMode !== 'read_only'
          ? ['Warning: higher access mode reduces read_only safety; check Person Gate controls.']
          : [],
      testingDone: [
        {
          testName: 'duxcmd.v1.json Format Check',
          outcome: newMode === 'read_only' ? 'PASS' : 'WARNING',
          detail: `Rule file updated with mode=${newMode}.`,
        },
      ],
      status: newMode === 'read_only' ? 'PASS' : 'WARNING',
    });
  };

  const handleResetPolicy = () => {
    setPolicyConfig(DEFAULT_DUXCMD_POLICY);
    setPolicyJsonText(JSON.stringify(DEFAULT_DUXCMD_POLICY, null, 2));
    setJsonError(null);
    setLastPolicyOutcome(null);
  };

  const runPathValidation = (
    overrideAction?: 'read' | 'write' | 'execute' | 'delete',
    overridePath?: string
  ) => {
    const act = overrideAction || actionType;
    const tgt = overridePath !== undefined ? overridePath : targetPath;
    if (overrideAction) setActionType(overrideAction);
    if (overridePath !== undefined) setTargetPath(overridePath);

    const outcome = validateDuxcmdAction(policyConfig, act, tgt);
    setLastPolicyOutcome(outcome);
    onUpdateMetrics((prev) => ({ ...prev, policyChecksRun: prev.policyChecksRun + 1 }));

    onLogEvent({
      type: 'TEST_PROBE',
      title: `Folder Rule Check: ${act.toUpperCase()} ${tgt}`,
      inputText: `python3 scripts/policy_enforcer.py ${act} "${tgt}"`,
      outputText: outcome.message,
      whatChanged: [],
      whatFailed: outcome.allowed ? [] : [outcome.message],
      testingDone: [
        {
          testName: `policy_enforcer.validate_action(${act})`,
          outcome: outcome.allowed ? 'PASS' : 'FAIL',
          detail: `Rule checked: ${outcome.ruleMatched}`,
        },
      ],
      status: outcome.allowed ? 'PASS' : 'FAIL',
    });
  };

  const runCommandOpValidation = (overrideCmd?: string, overrideDirective?: string) => {
    const cmd = overrideCmd !== undefined ? overrideCmd : commandOpInput;
    const directive = overrideDirective !== undefined ? overrideDirective : commandDirectiveInput;
    if (overrideCmd !== undefined) setCommandOpInput(cmd);
    if (overrideDirective !== undefined) setCommandDirectiveInput(directive);

    const outcome = validateCommandOperation(policyConfig, cmd, directive);
    setLastCommandOutcome(outcome);
    onUpdateMetrics((prev) => ({ ...prev, policyChecksRun: prev.policyChecksRun + 1 }));

    onLogEvent({
      type: 'TEST_PROBE',
      title: `AI Command Check: ${outcome.commandOp}`,
      inputText: `${cmd} :: ${directive}`,
      outputText: `${outcome.message}\nFix: ${outcome.correctedOperation}`,
      whatChanged: [],
      whatFailed: outcome.allowed ? [] : [outcome.message],
      testingDone: [
        {
          testName: `SP-02 No-Loop & Command Gate (${outcome.commandOp})`,
          outcome: outcome.allowed ? 'PASS' : 'FAIL',
          detail: outcome.correctedOperation,
        },
      ],
      status: outcome.allowed ? 'PASS' : 'FAIL',
    });
  };

  const handleSubmitGateway = (overrideAction?: string, overrideParams?: string) => {
    const act = (overrideAction || gatewayAction).trim().toUpperCase();
    const prm = overrideParams !== undefined ? overrideParams : gatewayParams;
    if (overrideAction) setGatewayAction(act);
    if (overrideParams !== undefined) setGatewayParams(prm);

    if (!act) return;

    const baseTrace = [
      `$ ./scripts/execution_gateway.sh ${act} "${prm}"`,
      `[GATE CHECK] Requested action: ${act}`,
      `[GATE CHECK] Inputs: ${prm || '(none)'}`,
    ];

    if (act === 'DEPLOY' || act === 'WRITE_SYS' || act === 'EXECUTE' || act === 'PROPOSE_PATCH') {
      setPendingGatewayRequest({
        action: act,
        params: prm,
        trace: [
          ...baseTrace,
          `[PERSON MUST APPROVE] Allow ${act}? (y/N): _`,
        ],
      });
    } else {
      const resolvedTrace = [...baseTrace, `[APPROVED] Running action: ${act}`];
      const record: GatewayHistoryItem = {
        id: `gw-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action: act,
        params: prm,
        outcome: 'APPROVED',
        trace: resolvedTrace,
      };
      setGatewayHistory((prev) => [record, ...prev]);
      onUpdateMetrics((prev) => ({ ...prev, gatewayDecisions: prev.gatewayDecisions + 1 }));

      onLogEvent({
        type: 'TEST_PROBE',
        title: `Person Gate: ${act} Allowed (Read-Only)`,
        inputText: `./scripts/execution_gateway.sh ${act} "${prm}"`,
        outputText: resolvedTrace.join('\n'),
        whatChanged: [],
        whatFailed: [],
        testingDone: [
          {
            testName: 'execution_gateway.sh Safety Check',
            outcome: 'PASS',
            detail: `Read action '${act}' passed check.`,
          },
        ],
        status: 'PASS',
      });
    }
  };

  const handleResolveGateway = (approved: boolean) => {
    if (!pendingGatewayRequest) return;
    const { action, params, trace } = pendingGatewayRequest;

    const finalLine = approved
      ? `[APPROVED] Running action: ${action}`
      : `[REJECTED] Stopped because the person said No.`;

    const fullTrace = [
      ...trace.slice(0, -1),
      `[PERSON MUST APPROVE] Allow ${action}? (y/N): ${approved ? 'y' : 'N'}`,
      finalLine,
    ];

    const record: GatewayHistoryItem = {
      id: `gw-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action,
      params,
      outcome: approved ? 'APPROVED' : 'REJECTED',
      trace: fullTrace,
    };

    setGatewayHistory((prev) => [record, ...prev]);
    setPendingGatewayRequest(null);
    onUpdateMetrics((prev) => ({ ...prev, gatewayDecisions: prev.gatewayDecisions + 1 }));

    onLogEvent({
      type: 'TEST_PROBE',
      title: `Person Gate: ${action} ${approved ? 'Approved' : 'Blocked'}`,
      inputText: `./scripts/execution_gateway.sh ${action} "${params}"`,
      outputText: fullTrace.join('\n'),
      whatChanged: approved
        ? [
            {
              area: 'Person Gate Status',
              before: `Waiting for approval on ${action}`,
              after: 'Person typed (y) to allow',
            },
          ]
        : [],
      whatFailed: approved ? [] : [`[REJECTED] ${action} stopped at person approval gate.`],
      testingDone: [
        {
          testName: 'Person Approval Check',
          outcome: approved ? 'VERIFIED' : 'FAIL',
          detail: approved
            ? `Person approved ${action}.`
            : `Person said No to ${action}; no files changed.`,
        },
      ],
      status: approved ? 'PASS' : 'FAIL',
    });
  };

  const handleRunClaimClassifier = (overrideClaim?: string, overrideEvidence?: string) => {
    const clm = overrideClaim !== undefined ? overrideClaim : claimText;
    const evText = overrideEvidence !== undefined ? overrideEvidence : evidenceText;
    if (overrideClaim !== undefined) setClaimText(clm);
    if (overrideEvidence !== undefined) setEvidenceText(evText);

    const lines = evText.split('\n');
    const outcome = classifyTechnicalClaim(clm, lines);
    setClaimOutcome(outcome);
    onUpdateMetrics((prev) => ({ ...prev, claimsClassified: prev.claimsClassified + 1 }));

    const logStatus =
      outcome.classification === 'Verified'
        ? 'PASS'
        : outcome.classification === 'Disputed'
        ? 'FAIL'
        : 'WARNING';

    onLogEvent({
      type: 'AUDIT',
      title: `Claim Checked: ${outcome.classification}`,
      inputText: `Claim: ${clm}\nProof:\n${evText || '(none)'}`,
      outputText: `Proof Level: ${outcome.classification}\nReason: ${outcome.rationale}`,
      whatChanged: [],
      whatFailed:
        outcome.classification === 'Disputed' || outcome.classification === 'Unknown'
          ? [outcome.rationale]
          : outcome.classification === 'Supported Inference'
          ? ['No real test run output yet — stays Clue from Files until tested via Person Gate.']
          : [],
      testingDone: [
        {
          testName: 'DuxcmdAgent.verify_technical_claim()',
          outcome:
            outcome.classification === 'Verified'
              ? 'VERIFIED'
              : outcome.classification === 'Supported Inference'
              ? 'SUPPORTED_INFERENCE'
              : outcome.classification === 'Disputed'
              ? 'FAIL'
              : 'WARNING',
          detail: outcome.rationale,
        },
      ],
      status: logStatus,
    });
  };

  const handleRunResourceTriage = (overrideText?: string) => {
    const text = overrideText !== undefined ? overrideText : resourceInput;
    if (overrideText !== undefined) setResourceInput(text);

    const outcome = classifyResourceAllocation(text);
    setResourceOutcome(outcome);
    onUpdateMetrics((prev) => ({ ...prev, claimsClassified: prev.claimsClassified + 1 }));

    const isProcessed = outcome.processingStatus === 'Processed';
    onLogEvent({
      type: 'AUDIT',
      title: `Power Check: ${outcome.inputType} -> ${outcome.processingStatus} (${outcome.resourceAllocation})`,
      inputText: text,
      outputText: `${outcome.processingStatus} (${outcome.resourceAllocation}) · ${outcome.systemReason}${
        outcome.equationCheck.found ? `\nMath: ${outcome.equationCheck.expression}` : ''
      }`,
      whatChanged: [],
      whatFailed: isProcessed ? [] : [outcome.systemReason],
      testingDone: [
        {
          testName: 'cmd:triage_resource · Math & Fact Check',
          outcome: isProcessed ? 'PASS' : outcome.equationCheck.found && !outcome.equationCheck.valid ? 'FAIL' : 'WARNING',
          detail: `${outcome.resourceAllocation} — ${outcome.systemReason}`,
        },
      ],
      status: isProcessed ? 'PASS' : outcome.equationCheck.found && !outcome.equationCheck.valid ? 'FAIL' : 'WARNING',
    });
  };

  const handleCopyFile = (content: string, path: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(path);
    setTimeout(() => setCopiedFile(null), 1800);
  };

  const handleDownloadSingleFile = (filename: string, content: string) => {
    const baseName = filename.split('/').pop() || filename;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = baseName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullBundleScript = () => {
    const scriptLines = [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      '# Swarmex Duxcmd Simple Safety Starter Kit',
      'ROOT_DIR="swarmex-duxcmd-agent"',
      'mkdir -p "${ROOT_DIR}/.config" "${ROOT_DIR}/docs" "${ROOT_DIR}/scripts" "${ROOT_DIR}/src" "${ROOT_DIR}/tests"',
      '',
      ...repoFiles.flatMap((file) => [
        `cat <<'SWARMEX_EOF' > "\${ROOT_DIR}/${file.path}"`,
        file.content.trimEnd(),
        'SWARMEX_EOF',
        '',
      ]),
      'chmod +x "${ROOT_DIR}/scripts/execution_gateway.sh" "${ROOT_DIR}/scripts/policy_enforcer.py"',
      'echo "[SWARMEX] Created starter folder at ./${ROOT_DIR}"',
    ];

    const content = scriptLines.join('\n');
    const blob = new Blob([content], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bootstrap_swarmex_duxcmd_agent.sh';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onUpdateMetrics((prev) => ({ ...prev, bundleExported: true }));
    onLogEvent({
      type: 'TEMPLATE_LOAD',
      title: 'Downloaded Starter Rule Files (8 Files)',
      inputText: `swarmex-duxcmd-agent/ (${repoFiles.map((f) => f.path).join(', ')})`,
      outputText: 'Saved bootstrap_swarmex_duxcmd_agent.sh starter script.',
      whatChanged: [],
      whatFailed: [],
      testingDone: [
        {
          testName: 'Starter Files Check',
          outcome: 'PASS',
          detail: `All ${repoFiles.length} safety files packed cleanly.`,
        },
      ],
      status: 'PASS',
    });
  };

  const handlePushToBuilder = () => {
    const allowedCmds =
      policyConfig.permissions.ai_command_operations || [
        'cmd:search_evidence',
        'cmd:verify_claim',
        'cmd:audit_invariants',
        'cmd:propose_single_patch',
        'cmd:escalate_human_gate',
      ];
    const loopMode = policyConfig.loop_policy?.mode || 'SINGLE_PASS_ONLY';
    const maxLoops = policyConfig.loop_policy?.max_auto_adjust_loops ?? 0;

    onSyncPolicyToBuilder({
      roleObjectives: {
        primaryObjective: `Run as ${policyConfig.agent.name} (${policyConfig.agent.version}) in ${policyConfig.agent.mode} mode using ${loopMode} safety rules and 5th-grade words.`,
        primaryTasks: `Use safe AI commands (${allowedCmds.join(', ')}); check folder paths, stop auto-loops, and ask a person before changes.`,
        finalOutputs:
          'Short Markdown report using 4 clear proof levels (Verified, Supported Inference, Unknown, Disputed).',
        successMetrics: `0 unapproved writes; max_auto_adjust_loops=${maxLoops}; log at ${policyConfig.audit.log_level} level.`,
      },
      systemArchitecture: {
        operationalBoundaries: `Safe box: ${policyConfig.execution_environment.type} (${policyConfig.execution_environment.isolation_level}), default_policy: ${policyConfig.execution_environment.default_policy}, loop_policy: ${loopMode}. Allowed read folders: ${policyConfig.permissions.file_system.read.join(', ')}.`,
        executionConstraints: `Mode: ${policyConfig.agent.mode}. Refuse repeating auto-fix loops on code or logic (max_auto_adjust_loops = ${maxLoops}) with [LOOP RULE BROKEN]; output 1 cmd:propose_single_patch -> cmd:escalate_human_gate (y/N).`,
        toolUsePolicies: `Allowed AI commands: ${allowedCmds.join(', ')}. Tools: ${policyConfig.permissions.tools.join(', ')}.`,
        workflowSequence:
          '1. SP-01 Route cmd:* -> 2. SP-02 Path & No-Loop Gate (policy_enforcer.py) -> 3. SP-03 Proof & Math -> 4. SP-04 Person Gate (execution_gateway.sh).',
        edgeCases:
          'Block unlisted folders with [SAFETY RULE STOPPED] and loops with [LOOP RULE BROKEN]. Hold unrun CLI claims at Supported Inference.',
      },
    });
  };

  const getTierStyle = (tier: ClaimEvaluationOutcome['classification']) => {
    switch (tier) {
      case 'Verified':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50';
      case 'Supported Inference':
        return 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50';
      case 'Disputed':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50';
      default:
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50';
    }
  };

  const formatSimpleTierLabel = (tier: ClaimEvaluationOutcome['classification']) => {
    switch (tier) {
      case 'Verified':
        return 'Proven (Verified)';
      case 'Supported Inference':
        return 'Clue from Files (Supported Inference)';
      case 'Disputed':
        return 'Conflicting (Disputed)';
      default:
        return 'Not Proven (Unknown)';
    }
  };

  const currentIdx = SUBSTEP_ORDER.indexOf(subTab);
  const currentMeta = SUBSTEP_META[subTab];
  const nextSubStep = currentIdx < SUBSTEP_ORDER.length - 1 ? SUBSTEP_ORDER[currentIdx + 1] : null;
  const prevSubStep = currentIdx > 0 ? SUBSTEP_ORDER[currentIdx - 1] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Focused Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            Step 5 of 5 · Final Safety Gates · <Lock className="w-3 h-3 inline text-emerald-600" /> {policyConfig.agent.mode}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-0.5">
            Final Safety &amp; Math Gates
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {currentMeta.hint}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePushToBuilder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-400 transition-colors"
          >
            <span>Send Rules to Step 1</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadFullBundleScript}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Rule Files</span>
          </button>
        </div>
      </div>

      {/* Step 5 Rule Checks */}
      <StepCompliancePanel
        step="swarmex"
        satisfiedIds={[
          ...(metrics.policyChecksRun > 0 ? ['req-5-1'] : []),
          ...(metrics.gatewayDecisions > 0 ? ['req-5-2'] : []),
          ...(metrics.claimsClassified > 0 ? ['req-5-3'] : []),
        ]}
      />

      {/* 4 Sub-Step Rail */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-neutral-100/75 dark:bg-neutral-900/75 border border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md">
        {SUBSTEP_ORDER.map((id) => {
          const meta = SUBSTEP_META[id];
          const Icon = meta.icon;
          const isActive = subTab === id;
          const doneCount =
            id === 'validator'
              ? metrics.policyChecksRun
              : id === 'gateway'
              ? metrics.gatewayDecisions
              : id === 'evidence'
              ? metrics.claimsClassified
              : metrics.bundleExported
              ? 1
              : 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors z-10 ${
                isActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="swarmexSubStepBg"
                  className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">
                  {meta.num} {meta.label}
                </div>
                <div className="text-[10px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                  {doneCount > 0 ? `${doneCount} checked` : 'Ready'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* SUB-STEP 5.1: Path & Loop Gate */}
      {subTab === 'validator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="flex flex-col bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-neutral-500" />
                .config/duxcmd.json
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={policyConfig.agent.mode}
                  onChange={(e) => handleToggleAgentMode(e.target.value as any)}
                  className="px-2 py-1 text-[11px] font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200"
                >
                  <option value="read_only">mode: read_only</option>
                  <option value="restricted_write">mode: restricted_write</option>
                  <option value="elevated">mode: elevated</option>
                </select>
                <button
                  type="button"
                  onClick={handleResetPolicy}
                  title="Reset to default rules"
                  className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded border border-neutral-200 dark:border-neutral-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <textarea
                rows={16}
                value={policyJsonText}
                onChange={(e) => handlePolicyJsonChange(e.target.value)}
                spellCheck={false}
                className="w-full flex-1 p-3.5 font-mono text-xs leading-relaxed bg-neutral-950 text-neutral-100 rounded-xl border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 resize-none"
              />
              {jsonError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-mono">
                  {jsonError}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100">
                scripts/policy_enforcer.py · Folder &amp; Mode Check
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Action
                    </label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="read">read</option>
                      <option value="write">write</option>
                      <option value="execute">execute</option>
                      <option value="delete">delete</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Folder or File Path
                    </label>
                    <input
                      type="text"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runPathValidation()}
                  disabled={Boolean(jsonError)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Check Path Rule</span>
                </button>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => runPathValidation('read', '/workspace/src/agent.py')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                  >
                    read /workspace/src/agent.py
                  </button>
                  <button
                    type="button"
                    onClick={() => runPathValidation('read', '/etc/passwd')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                  >
                    read /etc/passwd
                  </button>
                  <button
                    type="button"
                    onClick={() => runPathValidation('write', '/workspace/src/main.py')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                  >
                    write /workspace/src/main.py
                  </button>
                  <button
                    type="button"
                    onClick={() => runPathValidation('execute', '/workspace/scripts/deploy.sh')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                  >
                    execute deploy.sh
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 text-neutral-100 border border-neutral-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-2">
                  <span>Folder Check Output</span>
                  {lastPolicyOutcome && (
                    <span className={`font-bold flex items-center gap-1 ${lastPolicyOutcome.allowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {lastPolicyOutcome.allowed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {lastPolicyOutcome.allowed ? 'PASS' : 'BLOCKED'}
                    </span>
                  )}
                </div>
                {lastPolicyOutcome ? (
                  <div className="space-y-1">
                    <div className={lastPolicyOutcome.allowed ? 'text-emerald-400' : 'text-rose-400'}>
                      {simplifyAndRedactText(lastPolicyOutcome.message)}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Rule: {lastPolicyOutcome.ruleMatched} · Exit {lastPolicyOutcome.allowed ? '0' : '1'}
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500">Pick a quick test or type a path to check folder rules.</div>
                )}
              </div>

              {/* AI Commands & No-Loop Gate Tester */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    AI Command &amp; No-Loop Gate
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {policyConfig.loop_policy?.mode || 'SINGLE_PASS_ONLY'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={commandOpInput}
                    onChange={(e) => setCommandOpInput(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="cmd:triage_resource">cmd:triage_resource</option>
                    <option value="cmd:search_evidence">cmd:search_evidence</option>
                    <option value="cmd:verify_claim">cmd:verify_claim</option>
                    <option value="cmd:audit_invariants">cmd:audit_invariants</option>
                    <option value="cmd:propose_single_patch">cmd:propose_single_patch</option>
                    <option value="cmd:escalate_human_gate">cmd:escalate_human_gate</option>
                    <option value="cmd:auto_rewrite_loop">cmd:auto_rewrite_loop (Blocked)</option>
                  </select>
                  <input
                    type="text"
                    value={commandDirectiveInput}
                    onChange={(e) => setCommandDirectiveInput(e.target.value)}
                    placeholder="Order to check for repeating auto-fix loops..."
                    className="sm:col-span-2 px-2.5 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => runCommandOpValidation()}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg"
                  >
                    Check AI Command
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      runCommandOpValidation(
                        'cmd:propose_single_patch',
                        'Auto-adjust and rewrite logic in a loop until tests pass'
                      )
                    }
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                  >
                    Test Loop Stop
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      runCommandOpValidation(
                        'cmd:audit_invariants',
                        'Check rule file once without edits'
                      )
                    }
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                  >
                    Test One-Pass Op
                  </button>
                </div>
                {lastCommandOutcome && (
                  <div className="p-3 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-[11px] space-y-1 border border-neutral-800">
                    <div className={lastCommandOutcome.allowed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {simplifyAndRedactText(lastCommandOutcome.message)}
                    </div>
                    <div className="text-neutral-400">
                      Next Safe Step: {simplifyAndRedactText(lastCommandOutcome.correctedOperation)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-STEP 5.2: Person Approval Gate */}
      {subTab === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              scripts/execution_gateway.sh · Person Check Prompt
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Action
                </label>
                <select
                  value={gatewayAction}
                  onChange={(e) => setGatewayAction(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  <option value="DEPLOY">DEPLOY (Needs y/N)</option>
                  <option value="PROPOSE_PATCH">PROPOSE_PATCH (1 Fix · y/N)</option>
                  <option value="WRITE_SYS">WRITE_SYS (Needs y/N)</option>
                  <option value="EXECUTE">EXECUTE (Needs y/N)</option>
                  <option value="SEARCH_EVIDENCE">SEARCH_EVIDENCE (Read Only)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Inputs
                </label>
                <input
                  type="text"
                  value={gatewayParams}
                  onChange={(e) => setGatewayParams(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmitGateway()}
              disabled={Boolean(pendingGatewayRequest)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Send to Person Gate</span>
            </button>

            {pendingGatewayRequest && (
              <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 font-mono">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Allow {pendingGatewayRequest.action}? (y/N)</span>
                </div>
                <pre className="p-3 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-[11px] whitespace-pre-wrap">
                  {pendingGatewayRequest.trace.join('\n')}
                </pre>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleResolveGateway(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-neutral-900 border border-rose-300 dark:border-rose-800 rounded-lg"
                  >
                    Say No (N)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveGateway(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                  >
                    Say Yes (y)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 backdrop-blur-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Person Gate History
              </span>
              <span className="text-[11px] font-mono tabular-nums text-neutral-500">
                {gatewayHistory.length} checks
              </span>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[340px]">
              {gatewayHistory.length === 0 ? (
                <div className="text-center py-10 text-xs text-neutral-500">
                  Send an action on the left to test the <span className="font-mono">(y/N)</span> person stop prompt.
                </div>
              ) : (
                gatewayHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-neutral-950 text-neutral-200 font-mono text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{item.action} · {item.timestamp}</span>
                      <span className={item.outcome === 'APPROVED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        [{item.outcome}]
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-neutral-400 leading-relaxed">{item.trace.join('\n')}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-STEP 5.3: 4 Proof Levels & Resource/Math Gate */}
      {subTab === 'evidence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              src/agent.py · Proof Level Checker
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Statement to Check
              </label>
              <input
                type="text"
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                File Clues &amp; Test Output (one line each)
              </label>
              <textarea
                rows={4}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRunClaimClassifier()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Check Proof Level</span>
            </button>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleRunClaimClassifier('CLI runs inside safe box VM', 'Found config option isolation_level: strict_sandbox')}
                className="px-2.5 py-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
              >
                File Only (Clue from Files)
              </button>
              <button
                type="button"
                onClick={() => handleRunClaimClassifier('Rule checker blocks writes', 'EXECUTED: pytest tests/test_policy_enforcement.py -> PASSED (4/4) exit code 0')}
                className="px-2.5 py-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
              >
                Test Passed (Proven)
              </button>
              <button
                type="button"
                onClick={() => handleRunClaimClassifier('Web blocker stops IPv6', '')}
                className="px-2.5 py-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
              >
                No Proof (Unknown)
              </button>
              <button
                type="button"
                onClick={() => handleRunClaimClassifier('Agent stays read-only', 'duxcmd.json sets read_only\nCONFLICT: test FAILED')}
                className="px-2.5 py-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
              >
                Disagrees (Conflicting)
              </button>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              Proof Result &amp; 4 Levels
            </div>

            {claimOutcome ? (
              <div className={`p-4 rounded-xl border space-y-1.5 ${getTierStyle(claimOutcome.classification)}`}>
                <div className="text-xs font-bold font-mono">Level: {formatSimpleTierLabel(claimOutcome.classification)}</div>
                <div className="text-xs font-semibold">{simplifyAndRedactText(claimOutcome.claim)}</div>
                <p className="text-xs opacity-90 leading-relaxed">{simplifyAndRedactText(claimOutcome.rationale)}</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-500">
                Pick a sample or click Check Proof Level to see the simple proof level.
              </div>
            )}

            <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden text-xs">
              <div className="p-2.5">
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">Proven</span>
                <span className="text-neutral-600 dark:text-neutral-400"> · Real test or command ran and passed.</span>
              </div>
              <div className="p-2.5">
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">Clue from Files</span>
                <span className="text-neutral-600 dark:text-neutral-400"> · Shown in code or files, but not run yet.</span>
              </div>
              <div className="p-2.5">
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">Unknown</span>
                <span className="text-neutral-600 dark:text-neutral-400"> · Not enough proof found yet.</span>
              </div>
              <div className="p-2.5">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">Conflicting</span>
                <span className="text-neutral-600 dark:text-neutral-400"> · Files disagree or a test failed.</span>
              </div>
            </div>
          </div>

          {/* Power & Math Gate Panel */}
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  cmd:triage_resource · Numbers &amp; Math Gate
                </span>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  0% Power for Stories &amp; Opinions
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Input Text or Numbers
                </label>
                <textarea
                  rows={3}
                  value={resourceInput}
                  onChange={(e) => setResourceInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleRunResourceTriage('Personal statements about individual behavior.')
                  }
                  className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                >
                  Example A: Personal (Ignored)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleRunResourceTriage(
                      'Escrow account totals: $4,200, mortgage interest rates: 6.25%, tax returns: $95,000. Equation: 2 + 2 = 4.'
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                >
                  Example B: Money &amp; 2+2=4 (Run)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleRunResourceTriage(
                      'Escrow account totals: $4,200. Verify equation: 2 + 2 = 5.'
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
                >
                  Wrong Math (2+2=5)
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRunResourceTriage()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Check Power &amp; Math</span>
              </button>

              {resourceOutcome && (
                <div className="p-3.5 rounded-xl bg-neutral-950 text-neutral-100 font-mono text-[11px] space-y-2 border border-neutral-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-neutral-300">
                      {resourceOutcome.inputType}
                    </span>
                    <span
                      className={
                        resourceOutcome.processingStatus === 'Processed'
                          ? 'text-emerald-400 font-bold tabular-nums'
                          : 'text-rose-400 font-bold tabular-nums'
                      }
                    >
                      {resourceOutcome.processingStatus} · {resourceOutcome.resourceAllocation}
                    </span>
                  </div>
                  <div className="text-neutral-400">{simplifyAndRedactText(resourceOutcome.systemReason)}</div>
                  {resourceOutcome.equationCheck.found && (
                    <div
                      className={
                        resourceOutcome.equationCheck.valid
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      Math check: {resourceOutcome.equationCheck.expression}{' '}
                      {resourceOutcome.equationCheck.valid ? '(Right)' : '(Wrong)'}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-neutral-800 text-[10px]">
                    <div className={resourceOutcome.standards.hasNumericOrRule ? 'text-emerald-400' : 'text-rose-400'}>
                      Numbers/Rule: {resourceOutcome.standards.hasNumericOrRule ? 'PASS' : 'FAIL'}
                    </div>
                    <div className={resourceOutcome.standards.mathAccurate ? 'text-emerald-400' : 'text-rose-400'}>
                      Math Right: {resourceOutcome.standards.mathAccurate ? 'PASS' : 'FAIL'}
                    </div>
                    <div className={resourceOutcome.standards.excludesNonFactual ? 'text-emerald-400' : 'text-rose-400'}>
                      Facts Only: {resourceOutcome.standards.excludesNonFactual ? 'PASS' : 'FAIL'}
                    </div>
                    <div className={resourceOutcome.standards.shortAndClear ? 'text-emerald-400' : 'text-amber-400'}>
                      Short &amp; Simple: {resourceOutcome.standards.shortAndClear ? 'PASS' : 'LONG'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 backdrop-blur-xl space-y-4">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                Power Rules &amp; Simple Standards
              </div>
              <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 bg-neutral-50/70 dark:bg-neutral-800/40">
                      <th className="py-2 px-3 font-semibold">Input Type</th>
                      <th className="py-2 px-3 font-semibold">Status</th>
                      <th className="py-2 px-3 font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
                    {RESOURCE_ALLOCATION_TABLE.map((row) => (
                      <tr key={row.inputType}>
                        <td className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                          {row.inputType}
                        </td>
                        <td
                          className={`py-2 px-3 font-mono font-bold ${
                            row.processingStatus === 'Processed'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {row.processingStatus}
                        </td>
                        <td className="py-2 px-3 text-neutral-600 dark:text-neutral-400">
                          {simplifyAndRedactText(row.systemReason)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                  Simple Rules
                </div>
                <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {EVALUATION_STANDARDS_LIST.map((std, idx) => (
                    <li key={idx} className="font-mono text-[11px]">
                      {idx + 1}. {simplifyAndRedactText(std)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-STEP 5.4: Starter Files + Safety Reference */}
      {subTab === 'repo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-xl">
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  swarmex-duxcmd-agent/
                </span>
                <span className="text-[11px] font-mono tabular-nums text-neutral-500">{repoFiles.length} files</span>
              </div>
              <div className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
                {repoFiles.map((file) => {
                  const active = file.path === selectedRepoFile.path;
                  return (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        active
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="font-mono truncate">{file.path}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                <span className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 truncate">
                  {selectedRepoFile.path}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyFile(selectedRepoFile.content, selectedRepoFile.path)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-md"
                  >
                    {copiedFile === selectedRepoFile.path ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFile === selectedRepoFile.path ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingleFile(selectedRepoFile.path, selectedRepoFile.content)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-md"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 flex-1 bg-neutral-950 text-neutral-100 font-mono text-xs leading-relaxed overflow-auto max-h-[380px] select-text">
                {selectedRepoFile.content}
              </pre>
            </div>
          </div>

          {/* Collapsible Safety Rules Reference */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white/80 dark:bg-neutral-900/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowComplianceRef((prev) => !prev)}
              className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <span>Safety Standards &amp; Guards (NIST SP 800-207 · OWASP · NIST 800-53)</span>
              {showComplianceRef ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showComplianceRef && (
              <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SWARMEX_FRAMEWORKS.map((fw) => (
                    <div key={fw.standard} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/70 space-y-1">
                      <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{fw.standard}</div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{fw.title}</div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{simplifyAndRedactText(fw.detail)}</p>
                    </div>
                  ))}
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                      <th className="py-2 pr-4 font-semibold">Safety Guard</th>
                      <th className="py-2 pr-4 font-semibold">Rule</th>
                      <th className="py-2 font-semibold">Where It Runs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-800/70">
                    {SWARMEX_SAFEGUARDS.map((row) => (
                      <tr key={row.safeguard}>
                        <td className="py-2 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">{row.safeguard}</td>
                        <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-400">{simplifyAndRedactText(row.description)}</td>
                        <td className="py-2 font-mono text-[11px] text-neutral-800 dark:text-neutral-200">{simplifyAndRedactText(row.mechanism)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Handoff Bar */}
      <div className="bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 pb-6">
        <StepHandoffBar
          stepLabel={`${currentMeta.num} ${currentMeta.label}`}
          completedSummary={
            nextSubStep
              ? `${metrics.policyChecksRun} SP-02 path checks · ${metrics.gatewayDecisions} SP-04 person checks · ${metrics.claimsClassified} SP-03 math & proof checks.`
              : metrics.bundleExported
              ? 'Rule files saved. You can send updated safety rules back to Step 1 anytime.'
              : 'Read all 8 rule files above or send these rules back to Step 1.'
          }
          isStepComplete={
            metrics.policyChecksRun > 0 ||
            metrics.gatewayDecisions > 0 ||
            metrics.claimsClassified > 0 ||
            metrics.bundleExported
          }
          backLabel={prevSubStep ? `Back to ${SUBSTEP_META[prevSubStep].num}` : 'Back to Step 4: Test Live'}
          onBack={() => {
            if (prevSubStep) setSubTab(prevSubStep);
            else onNavigateToTab('simulator');
          }}
          secondaryAction={
            !nextSubStep
              ? {
                  label: 'Send Rules to Step 1',
                  onClick: handlePushToBuilder,
                }
              : undefined
          }
          primaryLabel={
            nextSubStep
              ? `Next: ${SUBSTEP_META[nextSubStep].num} ${SUBSTEP_META[nextSubStep].label}`
              : 'Download Starter Files'
          }
          onPrimary={() => {
            if (nextSubStep) setSubTab(nextSubStep);
            else handleDownloadFullBundleScript();
          }}
        />
      </div>
    </div>
  );
};

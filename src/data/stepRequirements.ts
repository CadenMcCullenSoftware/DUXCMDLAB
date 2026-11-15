import { WorkspaceTab } from '../types/agent';

export interface StepRequirementItem {
  id: string;
  title: string;
  requirement: string;
  annotation: string;
  commandOp: string;
}

export interface StepComplianceSpec {
  step: WorkspaceTab;
  heading: string;
  summaryLine: string;
  antiLoopRule: string;
  items: StepRequirementItem[];
}

export interface AiCommandOpDefinition {
  command: string;
  scope: 'READ_ONLY' | 'PROPOSAL_ONLY' | 'HUMAN_GATED';
  loopPolicy: 'SINGLE_PASS_ONLY';
  purpose: string;
}

export const AI_COMMAND_OPERATIONS_CATALOG: AiCommandOpDefinition[] = [
  {
    command: 'cmd:triage_resource',
    scope: 'READ_ONLY',
    loopPolicy: 'SINGLE_PASS_ONLY',
    purpose: 'Give 0% power to personal stories or opinions, and 100% power to numbers, money, or rules.',
  },
  {
    command: 'cmd:search_evidence',
    scope: 'READ_ONLY',
    loopPolicy: 'SINGLE_PASS_ONLY',
    purpose: 'Look at allowed files once without changing anything.',
  },
  {
    command: 'cmd:verify_claim',
    scope: 'READ_ONLY',
    loopPolicy: 'SINGLE_PASS_ONLY',
    purpose: 'Sort facts into 4 proof levels: Proven, Clue from Files, Unknown, or Conflicting.',
  },
  {
    command: 'cmd:audit_invariants',
    scope: 'READ_ONLY',
    loopPolicy: 'SINGLE_PASS_ONLY',
    purpose: 'Check hard limits, no-loop rules, and simple word rules in one pass.',
  },
  {
    command: 'cmd:propose_single_patch',
    scope: 'PROPOSAL_ONLY',
    loopPolicy: 'SINGLE_PASS_ONLY',
    purpose: 'Show 1 small fix after a problem. Never repeat or loop by itself.',
  },
  {
    command: 'cmd:escalate_human_gate',
    scope: 'HUMAN_GATED',
    loopPolicy: 'SINGLE_PASS_ONLY',
    purpose: 'Stop and ask a person (y/N) before changing any code, logic, or system.',
  },
];

export const STEP_COMPLIANCE_SPECS: Record<WorkspaceTab, StepComplianceSpec> = {
  builder: {
    step: 'builder',
    heading: 'Step 1 Rules · Constraints, Schema & AI Commands',
    summaryLine:
      'Define hard boundaries, exact TechnicalResponsePayload schema keys, and one-pass cmd:* commands.',
    antiLoopRule: 'NO_SELF_MODIFYING_LOOPS · max_auto_adjust_loops = 0',
    items: [
      {
        id: 'req-1-1',
        title: 'No-Loop & Profiling Refusal',
        requirement:
          'Block repeating auto-fix loops (max_auto_adjust_loops = 0) and refuse personal profiling or personal opinions in 1.2 Hard Rules.',
        annotation:
          'Note: Enforces strict technical scope and blocks speculative or personal trait inference.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-1-2',
        title: 'Pick Exact AI Commands',
        requirement:
          'List allowed one-pass commands in 1.2 Tool Rules and enforce publicly verifiable https:// URLs with zero intent modeling.',
        annotation:
          'Note: Prevents misinformation and ensures retrieved web context stays uncorrupted.',
        commandOp: 'cmd:propose_single_patch',
      },
      {
        id: 'req-1-3',
        title: 'Schema Keys & Factual Grounding',
        requirement:
          'Enforce exact keys ("context", "explicit requirements", "response_data") without synonyms and keep math exact.',
        annotation:
          'Note: Eliminates ambient text and aligns outputs with draft/2020-12 JSON Schema.',
        commandOp: 'cmd:triage_resource',
      },
    ],
  },
  review: {
    step: 'review',
    heading: 'Step 2 Rules · Schema & Step Verification',
    summaryLine:
      'Confirm SP-01 -> SP-04 compiled cleanly with zero drift, no auto-loops, and exact schema keys.',
    antiLoopRule: 'Check SINGLE_PASS_ONLY locks in SP-02 & SP-04',
    items: [
      {
        id: 'req-2-1',
        title: 'No-Loop & Refusal Lock',
        requirement:
          'Verify built rules block repeating auto-loops, personal profiling, and ambient conversational phrasing.',
        annotation:
          'Note: Keeps original technical requirements 100% intact without speculative drift.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-2-2',
        title: 'Schema & Helper Trace',
        requirement:
          'Confirm TechnicalResponsePayload keys ("context", "explicit requirements", "response_data") and SP-01 -> SP-04 gates appear cleanly.',
        annotation:
          'Note: Enforces Goal -> Limits -> Proof & URL check -> Valid Output in order.',
        commandOp: 'cmd:verify_claim',
      },
      {
        id: 'req-2-3',
        title: 'Rebuild After Edits',
        requirement:
          'If Step 1 fields change, click Re-build before auditing in Step 3.',
        annotation:
          'Note: Prevents auditing stale rules.',
        commandOp: 'cmd:search_evidence',
      },
    ],
  },
  audit: {
    step: 'audit',
    heading: 'Step 3 Rules · Schema, Profiling & URL Compliance',
    summaryLine:
      'Audit rules for Prerequisites Validation, TechnicalResponsePayload Schema, Profiling Refusal, and Verifiable URLs.',
    antiLoopRule: '0% tolerance for ambient text or silent loops',
    items: [
      {
        id: 'req-3-1',
        title: 'Schema & Anti-Loop Score',
        requirement:
          'Confirm JSON Schema and No-Loop dimensions pass without CRITICAL findings.',
        annotation:
          'Note: Flags missing schema keys, key synonyms, or retry-loop patterns.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-3-2',
        title: 'Factual & URL Grounding',
        requirement:
          'Verify claims use 4 proof levels and web context requires publicly verifiable https:// URLs without intent modeling.',
        annotation:
          'Note: Stops unrun claims from being labeled Proven and blocks distorted external context.',
        commandOp: 'cmd:verify_claim',
      },
      {
        id: 'req-3-3',
        title: 'Single-Pass Remediation',
        requirement:
          'Resolve any deficiency with one clean rule update instead of iterative auto-retries.',
        annotation:
          'Note: Keeps deterministic human control over edits.',
        commandOp: 'cmd:propose_single_patch',
      },
    ],
  },
  simulator: {
    step: 'simulator',
    heading: 'Step 4 Rules · Live Schema, Refusal & URL Tests',
    summaryLine:
      'Verify pure TechnicalResponsePayload JSON output, personal profiling refusal, and web source protocol enforcement.',
    antiLoopRule: 'Zero ambient text around JSON outputs',
    items: [
      {
        id: 'req-4-1',
        title: 'JSON Schema Validation',
        requirement:
          'Run "JSON Schema" and confirm output passes with exact keys: context, "explicit requirements", response_data.',
        annotation:
          'Note: Zero markdown preamble or conversational wrappers permitted.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-4-2',
        title: 'Profiling Refusal & No-Loop',
        requirement:
          'Run "Refuse Profiling" and "Stop Loop" to verify immediate refusal with zero trait inference.',
        annotation:
          'Note: Confirms SP-01 and SP-02 block non-technical and self-looping prompts.',
        commandOp: 'cmd:propose_single_patch',
      },
      {
        id: 'req-4-3',
        title: 'Web Source & URL Protocol',
        requirement:
          'Test "Web Source Rule" (verifiable https:// URL -> PASS) and "Bad Web URL" (intent modeling / local URL -> BLOCKED).',
        annotation:
          'Note: Verifies external context rules and URL integrity in SP-02/SP-03.',
        commandOp: 'cmd:escalate_human_gate',
      },
      {
        id: 'req-4-4',
        title: '0% Story & 100% Math Check',
        requirement:
          'Test "Story (0% Power)" and "Money & 2+2=4" to confirm deterministic arithmetic verification.',
        annotation:
          'Note: Confirms exact numerical evaluation and zero speculative computation.',
        commandOp: 'cmd:triage_resource',
      },
    ],
  },
  swarmex: {
    step: 'swarmex',
    heading: 'Step 5 Rules · Final Sandbox & Schema Locks',
    summaryLine:
      'Verify read-only folder bounds, no-loop lock, (y/N) human gate, and factual proof classification.',
    antiLoopRule: 'Enforce loop_policy.mode = SINGLE_PASS_ONLY',
    items: [
      {
        id: 'req-5-1',
        title: 'Path & Loop Lock (SP-02)',
        requirement:
          'Check .config/duxcmd.json enforces read_only mode, allowed folders only, and max_auto_adjust_loops: 0.',
        annotation:
          'Note: Test both file paths and loop commands in Part 5.1.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-5-2',
        title: 'Person Must Approve (SP-04)',
        requirement:
          'Confirm DEPLOY, WRITE_SYS, EXECUTE, and PROPOSE_PATCH pause for (y/N) approval.',
        annotation:
          'Note: Prevents unapproved side effects.',
        commandOp: 'cmd:escalate_human_gate',
      },
      {
        id: 'req-5-3',
        title: 'Sync Policy Back to Step 1',
        requirement:
          'Use "Send Rules to Step 1" after policy changes to keep Step 1 aligned.',
        annotation:
          'Note: Preserves consistent system boundaries.',
        commandOp: 'cmd:verify_claim',
      },
    ],
  },
};

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
    heading: 'Step 1 Rules · Simple Limits & AI Commands',
    summaryLine:
      'Write clear "never do" rules that block auto-loops, and pick exact cmd:* AI commands.',
    antiLoopRule: 'NO_SELF_MODIFYING_LOOPS · max_auto_adjust_loops = 0',
    items: [
      {
        id: 'req-1-1',
        title: 'Block Auto-Loops',
        requirement:
          'Write in 1.2 Hard Rules that the system must stop any loop that keeps changing code or logic by itself.',
        annotation:
          'Note: Stops the AI from guessing in circles or changing code until a test passes by luck.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-1-2',
        title: 'Pick Exact AI Commands',
        requirement:
          'List allowed commands in 1.2 Tool Rules using one-pass commands (cmd:search_evidence, cmd:verify_claim, cmd:propose_single_patch).',
        annotation:
          'Note: Only clear, one-step commands can run. No open-ended guessing.',
        commandOp: 'cmd:propose_single_patch',
      },
      {
        id: 'req-1-3',
        title: 'Numbers, Rules & 5th-Grade Words',
        requirement:
          'Write rules in 1.2 Edge Cases & 1.4 Shape that give 0% power to stories/personas, check math (like 2 + 2 = 4), and swap or [REDACTED] hard words.',
        annotation:
          'Note: Keeps computer power on real numbers, money rules, and plain 5th-grade language.',
        commandOp: 'cmd:triage_resource',
      },
    ],
  },
  review: {
    step: 'review',
    heading: 'Step 2 Rules · Compare & Lock Steps',
    summaryLine:
      'Make sure SP-01 -> SP-04 built cleanly with no auto-loops and simple 5th-grade words.',
    antiLoopRule: 'Check SINGLE_PASS_ONLY locks in SP-02 & SP-04',
    items: [
      {
        id: 'req-2-1',
        title: 'Check No-Loop Rule',
        requirement:
          'Make sure the new rules clearly refuse automatic loops that rewrite code or logic.',
        annotation:
          'Note: Compare your old draft and new rules to make sure your main goal stayed 100% the same.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-2-2',
        title: 'Check Helper Step Commands',
        requirement:
          'Look at the SP-01 -> SP-04 cards so every helper step uses one safe command.',
        annotation:
          'Note: Every turn runs in order: Goal -> Safety -> Math/Proof -> Person Check.',
        commandOp: 'cmd:verify_claim',
      },
      {
        id: 'req-2-3',
        title: 'Update When Draft Changes',
        requirement:
          'If you edit Step 1 after building, click Re-build before going to Step 3 Check.',
        annotation:
          'Note: Keeps you from checking old rules that do not match your latest edits.',
        commandOp: 'cmd:search_evidence',
      },
    ],
  },
  audit: {
    step: 'audit',
    heading: 'Step 3 Rules · Safety, No-Loop & Plain Words Check',
    summaryLine:
      'Check the built rules for no-loop locks, exact AI commands, and simple 5th-grade words with zero fluff.',
    antiLoopRule: '0% tolerance for silent self-edits',
    items: [
      {
        id: 'req-3-1',
        title: 'No-Loop & Command Score',
        requirement:
          'Make sure the No-Loop & AI Commands row passes with no big missing parts.',
        annotation:
          'Note: Flags any rule that tells the AI to "keep fixing in a loop" by itself.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-3-2',
        title: 'Honest Proof Check',
        requirement:
          'Make sure code that has not actually run stays marked as Clue from Files, not Proven.',
        annotation:
          'Note: Stops the AI from claiming a test passed without real run proof.',
        commandOp: 'cmd:verify_claim',
      },
      {
        id: 'req-3-3',
        title: 'One Fix at a Time',
        requirement:
          'Fix any missing rule with one clear Step 1 edit or one Fix Missing Parts click—never an auto-loop.',
        annotation:
          'Note: Keeps a real person in charge of every change.',
        commandOp: 'cmd:propose_single_patch',
      },
    ],
  },
  simulator: {
    step: 'simulator',
    heading: 'Step 4 Rules · Live Refusal & Simple Words Test',
    summaryLine:
      'Test that SP-02 blocks auto-loops, SP-04 asks a person, and replies stay in simple 5th-grade words.',
    antiLoopRule: 'Test live block on auto-loop commands',
    items: [
      {
        id: 'req-4-1',
        title: 'Auto-Loop Block Test',
        requirement:
          'Run the "Stop Auto-Loop" test and make sure SP-02 blocks it with [LOOP RULE BROKEN].',
        annotation:
          'Note: Proves the system stops repeating loops right on turn 1.',
        commandOp: 'cmd:audit_invariants',
      },
      {
        id: 'req-4-2',
        title: 'One-Step Fix Answer',
        requirement:
          'Check that the block shows one safe command fix (cmd:propose_single_patch -> cmd:escalate_human_gate).',
        annotation:
          'Note: Instead of looping, it offers 1 small fix waiting for (y/N).',
        commandOp: 'cmd:propose_single_patch',
      },
      {
        id: 'req-4-3',
        title: 'Check Helper Steps Trace',
        requirement:
          'Open Show Steps on a reply to see how SP-01 through SP-04 checked the message.',
        annotation:
          'Note: Every check is saved inside the Activity Log drawer too.',
        commandOp: 'cmd:escalate_human_gate',
      },
      {
        id: 'req-4-4',
        title: '0% Story & 100% Math Check',
        requirement:
          'Run Example A (Personal · 0% Power) and Example B (Money & 2 + 2 = 4 · 100% Power).',
        annotation:
          'Note: Stories get 0% computer power. Real numbers and 2 + 2 = 4 are checked directly.',
        commandOp: 'cmd:triage_resource',
      },
    ],
  },
  swarmex: {
    step: 'swarmex',
    heading: 'Step 5 Rules · Final Locks & Math Gate',
    summaryLine:
      'Test file read-only limits, no-loop locks, person (y/N) approval, and math/simple-word gates.',
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
          'Make sure DEPLOY, WRITE_SYS, EXECUTE, and PROPOSE_PATCH stop for (y/N) approval first.',
        annotation:
          'Note: Stops any background change from running without a person saying yes.',
        commandOp: 'cmd:escalate_human_gate',
      },
      {
        id: 'req-5-3',
        title: 'Send Rules Back to Step 1',
        requirement:
          'Click "Send Rules to Step 1" after editing limits so Step 1 stays up to date.',
        annotation:
          'Note: Updates your main setup cleanly under human control.',
        commandOp: 'cmd:verify_claim',
      },
    ],
  },
};

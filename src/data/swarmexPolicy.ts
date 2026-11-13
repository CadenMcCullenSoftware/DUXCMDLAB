import { DuxcmdPolicyConfig, EvidenceTier, SwarmexRepoFile } from '../types/agent';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';

export const DEFAULT_DUXCMD_POLICY: DuxcmdPolicyConfig = {
  $schema: 'https://swarmex.io/schemas/duxcmd.v1.json',
  agent: {
    name: 'duxcmd-researcher',
    version: '1.0.0',
    role: 'specialized_research',
    mode: 'read_only',
  },
  execution_environment: {
    type: 'virtual_machine',
    isolation_level: 'strict_sandbox',
    network_access: 'restricted',
    default_policy: 'deny_all',
  },
  loop_policy: {
    mode: 'SINGLE_PASS_ONLY',
    max_auto_adjust_loops: 0,
    refuse_looped_code_mutation: true,
  },
  permissions: {
    file_system: {
      read: ['/workspace/src', '/workspace/docs', '/workspace/.config'],
      write: [],
      execute: [],
    },
    tools: ['code_search', 'static_analysis', 'fetch_documentation'],
    ai_command_operations: [
      'cmd:search_evidence',
      'cmd:verify_claim',
      'cmd:audit_invariants',
      'cmd:propose_single_patch',
      'cmd:escalate_human_gate',
    ],
  },
  audit: {
    log_level: 'VERBOSE',
    destination: '/var/log/swarmex/duxcmd_audit.log',
  },
};

export interface CommandOpEvaluationOutcome {
  allowed: boolean;
  code: 'COMMAND_ALLOWED' | 'LOOP_INVARIANT_VIOLATION' | 'COMMAND_DENIED';
  commandOp: string;
  message: string;
  correctedOperation: string;
}

export function validateCommandOperation(
  config: DuxcmdPolicyConfig,
  commandOp: string,
  directiveText: string
): CommandOpEvaluationOutcome {
  const cleanCmd = commandOp.trim();
  const allowedOps = config.permissions?.ai_command_operations || [
    'cmd:search_evidence',
    'cmd:verify_claim',
    'cmd:audit_invariants',
    'cmd:propose_single_patch',
    'cmd:escalate_human_gate',
  ];
  const isLoopAttempt = /auto[-\s]?adjust|loop\s+until|retry\s+loop|self[-\s]?modify|while\s*\(|keep\s+(?:re-?writing|adjusting|patching)|writhing|automatic\s+adjustment/i.test(
    directiveText
  );

  if (isLoopAttempt) {
    return {
      allowed: false,
      code: 'LOOP_INVARIANT_VIOLATION',
      commandOp: cleanCmd || '(none)',
      message: simplifyAndRedactText(
        '[LOOP RULE BROKEN] Blocked repeating auto-fix loop on code or logic (max_auto_adjust_loops = 0).'
      ),
      correctedOperation: simplifyAndRedactText(
        'cmd:propose_single_patch (1 small fix only) -> cmd:escalate_human_gate (y/N person check)'
      ),
    };
  }

  if (!allowedOps.includes(cleanCmd)) {
    return {
      allowed: false,
      code: 'COMMAND_DENIED',
      commandOp: cleanCmd,
      message: simplifyAndRedactText(
        `[SAFETY RULE STOPPED] Command '${cleanCmd}' is not in the allowed command list.`
      ),
      correctedOperation: simplifyAndRedactText(`Use one of: ${allowedOps.join(', ')}`),
    };
  }

  return {
    allowed: true,
    code: 'COMMAND_ALLOWED',
    commandOp: cleanCmd,
    message: simplifyAndRedactText(
      `[POLICY PASSED] Command '${cleanCmd}' is allowed under ${config.loop_policy?.mode || 'SINGLE_PASS_ONLY'}.`
    ),
    correctedOperation: 'One-pass run allowed; zero repeating loops allowed.',
  };
}

export interface PolicyEvaluationOutcome {
  allowed: boolean;
  code: 'POLICY_PASSED' | 'SECURITY_VIOLATION';
  message: string;
  ruleMatched: string;
}

export function validateDuxcmdAction(
  config: DuxcmdPolicyConfig,
  actionType: 'read' | 'write' | 'execute' | 'delete',
  targetPath: string
): PolicyEvaluationOutcome {
  const cleanTarget = targetPath.trim();
  const mode = config.agent?.mode || 'read_only';
  const permissions = config.permissions?.file_system || { read: [], write: [], execute: [] };

  if (!cleanTarget) {
    return {
      allowed: false,
      code: 'SECURITY_VIOLATION',
      message: '[SAFETY RULE STOPPED] Empty file path blocked under default_policy: deny_all.',
      ruleMatched: 'default_policy: deny_all',
    };
  }

  // Block path traversal outside normalized prefix
  if (cleanTarget.includes('..')) {
    return {
      allowed: false,
      code: 'SECURITY_VIOLATION',
      message: `[SAFETY RULE STOPPED] Unsafe ".." path step found in '${cleanTarget}'. Blocked.`,
      ruleMatched: 'Path Guard',
    };
  }

  if (mode === 'read_only' && ['write', 'execute', 'delete'].includes(actionType)) {
    return {
      allowed: false,
      code: 'SECURITY_VIOLATION',
      message: `[SAFETY RULE STOPPED] Action '${actionType}' blocked in read_only mode.`,
      ruleMatched: 'agent.mode == read_only',
    };
  }

  if (actionType === 'read') {
    const allowedReadPaths = permissions.read || [];
    const matchedPrefix = allowedReadPaths.find((prefix) => cleanTarget.startsWith(prefix));
    if (matchedPrefix) {
      return {
        allowed: true,
        code: 'POLICY_PASSED',
        message: `[POLICY PASSED] Read on '${cleanTarget}' allowed (matched ${matchedPrefix}).`,
        ruleMatched: `permissions.file_system.read (${matchedPrefix})`,
      };
    }
    return {
      allowed: false,
      code: 'SECURITY_VIOLATION',
      message: `[SAFETY RULE STOPPED] Path '${cleanTarget}' is not in the allowed read folders.`,
      ruleMatched: 'permissions.file_system.read list',
    };
  }

  if (actionType === 'write') {
    const allowedWritePaths = permissions.write || [];
    const matchedPrefix = allowedWritePaths.find((prefix) => cleanTarget.startsWith(prefix));
    if (matchedPrefix) {
      return {
        allowed: true,
        code: 'POLICY_PASSED',
        message: `[POLICY PASSED] Write on '${cleanTarget}' allowed (matched ${matchedPrefix}).`,
        ruleMatched: `permissions.file_system.write (${matchedPrefix})`,
      };
    }
    return {
      allowed: false,
      code: 'SECURITY_VIOLATION',
      message: `[SAFETY RULE STOPPED] Path '${cleanTarget}' is not in the allowed write folders.`,
      ruleMatched: 'permissions.file_system.write list',
    };
  }

  if (actionType === 'execute') {
    const allowedExecPaths = permissions.execute || [];
    const matchedPrefix = allowedExecPaths.find((prefix) => cleanTarget.startsWith(prefix));
    if (matchedPrefix) {
      return {
        allowed: true,
        code: 'POLICY_PASSED',
        message: `[POLICY PASSED] Run on '${cleanTarget}' allowed (matched ${matchedPrefix}).`,
        ruleMatched: `permissions.file_system.execute (${matchedPrefix})`,
      };
    }
    return {
      allowed: false,
      code: 'SECURITY_VIOLATION',
      message: `[SAFETY RULE STOPPED] Path '${cleanTarget}' is not in the allowed run folders.`,
      ruleMatched: 'permissions.file_system.execute list',
    };
  }

  return {
    allowed: false,
    code: 'SECURITY_VIOLATION',
    message: `[SAFETY RULE STOPPED] Action '${actionType}' blocked by default_policy: deny_all.`,
    ruleMatched: 'default_policy: deny_all',
  };
}

export interface ClaimEvaluationOutcome {
  claim: string;
  classification: EvidenceTier;
  rationale: string;
  matchedSignals: string[];
}

export function classifyTechnicalClaim(
  claim: string,
  evidenceLines: string[]
): ClaimEvaluationOutcome {
  const cleanedEvidence = evidenceLines.map((e) => e.trim()).filter(Boolean);

  if (cleanedEvidence.length === 0) {
    return {
      claim: simplifyAndRedactText(claim),
      classification: 'Unknown',
      rationale: 'No file or test proof was found to check this claim.',
      matchedSignals: [],
    };
  }

  const conflictSignals = cleanedEvidence.filter((item) =>
    /\b(FAILED|FAIL|DISPUTED|MISMATCH|CONFLICT|ERROR|VIOLATION|BROKEN)\b/i.test(item)
  );
  if (conflictSignals.length > 0) {
    return {
      claim: simplifyAndRedactText(claim),
      classification: 'Disputed',
      rationale: 'Files disagree or a test failed in the proof lines.',
      matchedSignals: conflictSignals,
    };
  }

  const executionSignals = cleanedEvidence.filter((item) =>
    /\b(PASSED|EXECUTED|EXIT CODE 0|GATEWAY APPROVED|STDOUT VERIFIED)\b/i.test(item)
  );
  if (executionSignals.length > 0) {
    return {
      claim: simplifyAndRedactText(claim),
      classification: 'Verified',
      rationale: 'Proven by real command run output or passing test proof.',
      matchedSignals: executionSignals,
    };
  }

  return {
    claim: simplifyAndRedactText(claim),
    classification: 'Supported Inference',
    rationale: 'Shown in code or setup files, but not yet proven by a real test run.',
    matchedSignals: cleanedEvidence,
  };
}

export interface ResourceAllocationRow {
  inputType: string;
  processingStatus: 'Ignored' | 'Processed';
  systemReason: string;
}

export const RESOURCE_ALLOCATION_TABLE: ResourceAllocationRow[] = [
  {
    inputType: 'Personal comments',
    processingStatus: 'Ignored',
    systemReason: 'Stories and personal talk give zero real system value.',
  },
  {
    inputType: 'Opinions & stories',
    processingStatus: 'Ignored',
    systemReason: 'Opinions cannot be checked with math.',
  },
  {
    inputType: 'Numbers & math',
    processingStatus: 'Processed',
    systemReason: 'Math can be checked and proven true.',
  },
  {
    inputType: 'Money rules & amounts',
    processingStatus: 'Processed',
    systemReason: 'Money amounts and rules follow exact equations.',
  },
];

export const EVALUATION_STANDARDS_LIST: string[] = [
  'Statements must have real numbers or clear step-by-step rules.',
  'Math must be right (for example, 2 + 2 = 4).',
  'Leave out non-fact words, guesses, and physical action words.',
  'Keep explanations short, simple (5th-grade words), and clear.',
];

// Recursive-descent safe arithmetic evaluator (no eval / Function)
function evaluateSafeArithmetic(expr: string): number | null {
  const cleaned = expr.replace(/[$,\s]/g, '');
  if (!/^[0-9+\-*/().]+$/.test(cleaned) || cleaned.length === 0) return null;
  let pos = 0;

  function parseExpression(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (pos < cleaned.length && (cleaned[pos] === '+' || cleaned[pos] === '-')) {
      const op = cleaned[pos++];
      const right = parseTerm();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) return null;
    while (pos < cleaned.length && (cleaned[pos] === '*' || cleaned[pos] === '/')) {
      const op = cleaned[pos++];
      const right = parseFactor();
      if (right === null || (op === '/' && right === 0)) return null;
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number | null {
    if (pos >= cleaned.length) return null;
    if (cleaned[pos] === '(') {
      pos++;
      const inner = parseExpression();
      if (inner === null || cleaned[pos] !== ')') return null;
      pos++;
      return inner;
    }
    const start = pos;
    if (cleaned[pos] === '-') pos++;
    let hasDigit = false;
    while (pos < cleaned.length && /[0-9.]/.test(cleaned[pos])) {
      hasDigit = true;
      pos++;
    }
    if (!hasDigit) return null;
    const num = Number(cleaned.slice(start, pos));
    return Number.isFinite(num) ? num : null;
  }

  const result = parseExpression();
  if (result === null || pos !== cleaned.length) return null;
  return result;
}

export function verifyEquationInText(text: string): {
  found: boolean;
  valid: boolean;
  expression: string;
} {
  const eqMatch = text.match(/([$0-9.,+\-*/()\s]+)=([$0-9.,+\-*/()\s]+)/);
  if (!eqMatch) {
    return { found: false, valid: true, expression: '' };
  }
  const lhsRaw = eqMatch[1].trim();
  const rhsRaw = eqMatch[2].trim();
  const lhsVal = evaluateSafeArithmetic(lhsRaw);
  const rhsVal = evaluateSafeArithmetic(rhsRaw);
  if (lhsVal === null || rhsVal === null) {
    return { found: false, valid: true, expression: '' };
  }
  const valid = Math.abs(lhsVal - rhsVal) < 1e-6;
  return {
    found: true,
    valid,
    expression: `${lhsRaw} = ${rhsRaw}${valid ? '' : ` (expected ${lhsVal})`}`,
  };
}

export interface ResourceAllocationOutcome {
  inputType: 'Personal commentary' | 'Narrative claims' | 'Numerical data' | 'Financial specifications' | 'Procedural rules';
  processingStatus: 'Ignored' | 'Processed';
  resourceAllocation: '0% Compute' | '100% Compute';
  systemReason: string;
  equationCheck: { found: boolean; valid: boolean; expression: string };
  standards: {
    hasNumericOrRule: boolean;
    mathAccurate: boolean;
    excludesNonFactual: boolean;
    shortAndClear: boolean;
  };
}

export function classifyResourceAllocation(inputText: string): ResourceAllocationOutcome {
  const trimmed = inputText.trim();
  const equationCheck = verifyEquationInText(trimmed);
  const hasFinancial = /\b(escrow|mortgage|interest\s+rate|tax\s+return|balance|principal|apr|ledger|invoice)\b/i.test(trimmed);
  const hasNumeric = /\d+(?:\.\d+)?/.test(trimmed);
  const hasRuleKeyword = /\b(rule|equation|cmd:|policy|threshold|must|max_auto_adjust_loops|read_only)\b/i.test(trimmed);
  const hasPersonaOrPersonal = /\b(personal\s+(?:story|stories|commentary|statement|opinion)|individual\s+(?:persona|behavior)|feelings?|frustrated|favorite|yesterday\s+i|narrative|my\s+friend|hobby)\b/i.test(
    trimmed
  );
  const hasPhysicalActionNoise = /\b(walked|waiting\s+in\s+line|shouted|smiled|ran\s+down|felt\s+happy)\b/i.test(trimmed);

  const hasNumericOrRule = hasNumeric || hasRuleKeyword || hasFinancial;
  const isPureNonTechnical = !hasNumericOrRule || (hasPersonaOrPersonal && !hasFinancial && !equationCheck.found);

  if (isPureNonTechnical) {
    const isNarrative = /\b(opinion|narrative|story|stories|yesterday|feelings?)\b/i.test(trimmed);
    return {
      inputType: isNarrative ? 'Narrative claims' : 'Personal commentary',
      processingStatus: 'Ignored',
      resourceAllocation: '0% Compute',
      systemReason: isNarrative
        ? 'Opinions cannot be checked with math.'
        : 'Personal talk gives zero real system value.',
      equationCheck,
      standards: {
        hasNumericOrRule: false,
        mathAccurate: true,
        excludesNonFactual: false,
        shortAndClear: trimmed.length <= 240,
      },
    };
  }

  const mathAccurate = !equationCheck.found || equationCheck.valid;
  const inputType = hasFinancial
    ? 'Financial specifications'
    : hasNumeric || equationCheck.found
    ? 'Numerical data'
    : 'Procedural rules';

  return {
    inputType,
    processingStatus: mathAccurate ? 'Processed' : 'Ignored',
    resourceAllocation: mathAccurate ? '100% Compute' : '0% Compute',
    systemReason: simplifyAndRedactText(
      !mathAccurate
        ? `Math check failed: ${equationCheck.expression}. Math must be exact.`
        : hasFinancial
        ? 'Money amounts and rules follow exact equations.'
        : 'Math and clear rules can be checked with certainty.'
    ),
    equationCheck,
    standards: {
      hasNumericOrRule: true,
      mathAccurate,
      excludesNonFactual: !hasPersonaOrPersonal && !hasPhysicalActionNoise,
      shortAndClear: trimmed.length > 0 && trimmed.length <= 320,
    },
  };
}

export const SWARMEX_FRAMEWORKS = [
  {
    standard: 'NIST SP 800-207',
    title: 'Zero Trust Rules',
    detail: 'Check every folder, tool, and person gate request before allowing it.',
  },
  {
    standard: 'OWASP Agent Safety',
    title: 'Safety Guard Rules',
    detail: 'Stop prompt tricks, unapproved file edits, and unsafe shell runs.',
  },
  {
    standard: 'NIST SP 800-53 Rev 5',
    title: 'Access & Log Rules',
    detail: 'Lock down accounts, enforce folder rules, and save full activity logs.',
  },
];

export const SWARMEX_SAFEGUARDS = [
  {
    safeguard: 'Smallest Needed Access',
    description: 'Give the system only the smallest access it truly needs.',
    mechanism: 'read_only mode & duxcmd.json limit rules.',
  },
  {
    safeguard: 'Folder & Command Lists',
    description: 'Allow only listed folders and commands.',
    mechanism: 'Path checks inside scripts/policy_enforcer.py.',
  },
  {
    safeguard: 'Person Must Approve',
    description: 'Require a real person to say yes before big changes.',
    mechanism: 'y/N prompt inside scripts/execution_gateway.sh.',
  },
  {
    safeguard: 'Locked Safe Box',
    description: 'Run inside a locked virtual computer with blocked web access.',
    mechanism: 'Safe box VM with network filter.',
  },
];

export function buildSwarmexRepoFiles(config: DuxcmdPolicyConfig): SwarmexRepoFile[] {
  const jsonString = JSON.stringify(config, null, 2);

  return [
    {
      path: '.config/duxcmd.json',
      language: 'json',
      description: 'Sets agent mode, safe box limits, allowed folders, and no-loop rules.',
      content: jsonString,
    },
    {
      path: 'docs/agents.md',
      language: 'markdown',
      description: 'Lists simple system rules, allowed AI commands, and safety stops.',
      content: `# Duxcmd Simple Safety Rules

## Main Job
Read code files, check proof, and offer 1 small fix without changing system files on your own.

## Allowed AI Commands (One Pass Only)
- \`cmd:search_evidence\`: Search allowed folders once without editing files.
- \`cmd:verify_claim\`: Check whether a claim has real proof or only a file clue.
- \`cmd:audit_invariants\`: Check safety limits and no-loop rules in one pass.
- \`cmd:propose_single_patch\`: Show 1 small fix without applying or looping.
- \`cmd:escalate_human_gate\`: Stop and ask a person (y/N) before any change.

## Safety & No-Loop Rules
1. Never run shell commands that write files or change system settings.
2. BLOCK repeating auto-fix loops on logic or code (max_auto_adjust_loops = 0); offer 1 small fix instead.
3. Send every deploy or system change to the Person Approval Gate.
`,
    },
    {
      path: 'scripts/policy_enforcer.py',
      language: 'python',
      description: 'Checks every file action against duxcmd.json before it can run.',
      content: `#!/usr/bin/env python3
"""Simple Policy Checker for Duxcmd."""

import json
import sys
from pathlib import Path
from typing import Dict, Any


def load_config(config_path: Path) -> Dict[str, Any]:
    """Load the JSON rule file."""
    if not config_path.exists():
        raise FileNotFoundError(f"Rule file not found at {config_path}")
    with config_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_action(config: Dict[str, Any], action_type: str, target_path: str) -> bool:
    """Check if the action and folder are allowed."""
    permissions = config.get("permissions", {}).get("file_system", {})
    mode = config.get("agent", {}).get("mode", "read_only")

    if mode == "read_only" and action_type in ["write", "execute", "delete"]:
        print(f"[SAFETY RULE STOPPED] Action '{action_type}' blocked in read_only mode.", file=sys.stderr)
        return False

    allowed_read_paths = permissions.get("read", [])
    if action_type == "read":
        if any(target_path.startswith(path) for path in allowed_read_paths):
            return True
        print(f"[SAFETY RULE STOPPED] Path '{target_path}' is not in allowed read folders.", file=sys.stderr)
        return False

    return False


if __name__ == "__main__":
    cfg_file = Path(".config/duxcmd.json")
    if len(sys.argv) < 3:
        print("Usage: policy_enforcer.py <action_type> <target_path>")
        sys.exit(1)

    act = sys.argv[1]
    tgt = sys.argv[2]

    try:
        cfg = load_config(cfg_file)
        is_valid = validate_action(cfg, act, tgt)
        if is_valid:
            print(f"[POLICY PASSED] Action '{act}' on '{tgt}' allowed.")
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as err:
        print(f"[ERROR] Checker failed: {err}", file=sys.stderr)
        sys.exit(1)
`,
    },
    {
      path: 'scripts/execution_gateway.sh',
      language: 'bash',
      description: 'Stops and asks a person (y/N) before any big change runs.',
      content: `#!/usr/bin/env bash
set -euo pipefail

ACTION="\${1:-}"
PARAMS="\${2:-}"

if [[ -z "\${ACTION}" ]]; then
    echo "Usage: $0 <ACTION> [PARAMS]"
    exit 1
fi

echo "[GATE CHECK] Requested action: \${ACTION}"
echo "[GATE CHECK] Inputs: \${PARAMS}"

# Rule Check: Block unapproved changes
if [[ "\${ACTION}" == "DEPLOY" || "\${ACTION}" == "WRITE_SYS" || "\${ACTION}" == "EXECUTE" ]]; then
    read -p "[PERSON MUST APPROVE] Allow \${ACTION}? (y/N): " confirm
    if [[ "\${confirm}" != "y" && "\${confirm}" != "Y" ]]; then
        echo "[REJECTED] Blocked because the person said No."
        exit 1
    fi
fi

echo "[APPROVED] Running action: \${ACTION}"
exit 0
`,
    },
    {
      path: 'src/__init__.py',
      language: 'python',
      description: 'Package setup file for the Duxcmd agent.',
      content: `"""Swarmex Duxcmd Agent Package."""

from .agent import DuxcmdAgent

__all__ = ["DuxcmdAgent"]
`,
    },
    {
      path: 'src/agent.py',
      language: 'python',
      description: 'Main Duxcmd helper class and claim proof checker.',
      content: `"""Duxcmd Simple Agent Helper."""

import json
from pathlib import Path
from typing import Dict, List, Any


class DuxcmdAgent:
    """Safe read-only agent for checking code claims."""

    def __init__(self, config_path: str = ".config/duxcmd.json"):
        self.config_path = Path(config_path)
        self.config = self._load_configuration()
        self.agent_name = self.config["agent"]["name"]
        self.mode = self.config["agent"]["mode"]

    def _load_configuration(self) -> Dict[str, Any]:
        with open(self.config_path, "r", encoding="utf-8") as file:
            return json.load(file)

    def verify_technical_claim(self, claim: str, evidence: List[str]) -> Dict[str, str]:
        """Sort claims into simple proof levels."""
        if not evidence:
            return {"claim": claim, "classification": "Unknown"}

        has_conflict = any(
            marker in item.upper() for item in evidence for marker in ["FAILED", "ERROR", "DISPUTED", "CONFLICT"]
        )
        if has_conflict:
            return {"claim": claim, "classification": "Disputed"}

        has_execution_proof = any("PASSED" in item or "EXECUTED" in item for item in evidence)
        if has_execution_proof:
            return {"claim": claim, "classification": "Verified"}
        return {"claim": claim, "classification": "Supported Inference"}


if __name__ == "__main__":
    agent = DuxcmdAgent()
    res = agent.verify_technical_claim(
        "CLI runs inside safe box VM",
        ["Found config option isolation_level: strict_sandbox"]
    )
    print(f"Agent '{agent.agent_name}' Result: {res}")
`,
    },
    {
      path: 'src/main.py',
      language: 'python',
      description: 'Main CLI runner loading duxcmd.json and checking rules.',
      content: `"""Main CLI runner for Duxcmd Agent."""

import sys
from pathlib import Path
from .agent import DuxcmdAgent


def main() -> int:
    config_file = Path(".config/duxcmd.json")
    agent = DuxcmdAgent(str(config_file))
    result = agent.verify_technical_claim(
        "Duxcmd runs in safe read_only mode",
        [f"mode={agent.mode}", f"isolation={agent.config['execution_environment']['isolation_level']}"],
    )
    print(result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,
    },
    {
      path: 'tests/test_policy_enforcement.py',
      language: 'python',
      description: 'Unit tests checking read_only blocks, folder limits, and proof levels.',
      content: `"""Simple Safety Unit Tests for Swarmex Duxcmd."""

import unittest
from pathlib import Path
from scripts.policy_enforcer import load_config, validate_action
from src.agent import DuxcmdAgent


class TestSwarmexPolicyEnforcement(unittest.TestCase):
    def setUp(self) -> None:
        self.config = load_config(Path(".config/duxcmd.json"))
        self.agent = DuxcmdAgent(".config/duxcmd.json")

    def test_denies_write_in_read_only_mode(self) -> None:
        self.assertFalse(validate_action(self.config, "write", "/workspace/src/agent.py"))

    def test_allows_whitelisted_read_path(self) -> None:
        self.assertTrue(validate_action(self.config, "read", "/workspace/src/agent.py"))

    def test_denies_outside_read_path(self) -> None:
        self.assertFalse(validate_action(self.config, "read", "/etc/passwd"))

    def test_claim_without_execution_proof_is_supported_inference(self) -> None:
        res = self.agent.verify_technical_claim(
            "CLI runs in safe box",
            ["Found config option isolation_level: strict_sandbox"],
        )
        self.assertEqual(res["classification"], "Supported Inference")


if __name__ == "__main__":
    unittest.main()
`,
    },
  ];
}

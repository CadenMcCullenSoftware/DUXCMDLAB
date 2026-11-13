export interface RoleObjectives {
  primaryObjective: string;
  primaryTasks: string;
  finalOutputs: string;
  successMetrics: string;
}

export interface SystemArchitecture {
  operationalBoundaries: string;
  executionConstraints: string;
  toolUsePolicies: string;
  workflowSequence: string;
  edgeCases: string;
}

export interface DomainExpertise {
  technicalCapabilities: string;
  knowledgeBases: string;
  referenceStandards: string;
  algorithmicConventions: string;
}

export interface PersonaInteraction {
  toneAndVoice: string;
  communicationRegister: string;
  forbiddenPhrasing: string;
  formatSchemas: string;
}

export interface AgentConfigurationInputs {
  roleObjectives: RoleObjectives;
  systemArchitecture: SystemArchitecture;
  domainExpertise: DomainExpertise;
  personaInteraction: PersonaInteraction;
}

export interface ModificationLog {
  segment: string;
  category: string;
  originalExcerpt: string;
  revisedExcerpt: string;
  technicalRationale: string;
}

export interface ComplianceItem {
  criterion: string;
  status: string;
  evidence: string;
}

export interface OptimizationAuditReport {
  intentPreservationScore: number;
  driftRiskLevel: string;
  precisionEnhancementPercentage: number;
  fluffEliminatedCount: number;
  gapsIdentifiedAndAddressed: string[];
  modifications: ModificationLog[];
  complianceChecklist: ComplianceItem[];
}

export interface SubprocessTraceStep {
  subprocessId: string;
  name: string;
  role: string;
  status: 'PASS' | 'BLOCKED' | 'ESCALATED' | 'INFERENCE';
  summary: string;
  commandOp?: string;
  resourceAllocation?: 'PROCESSED' | 'IGNORED_ZERO_COMPUTE';
}

export interface OptimizationResult {
  agentTitle: string;
  executiveSummary: string;
  compiledSystemInstruction: string;
  refinedSections: AgentConfigurationInputs;
  auditReport: OptimizationAuditReport;
  subprocessTrace?: SubprocessTraceStep[];
}

export interface AuditEvaluation {
  dimension: string;
  score: number;
  status: 'PASS' | 'WARNING' | 'CRITICAL';
  finding: string;
  recommendation: string;
}

export interface IndependentAuditReport {
  overallHealthScore: number;
  fluffRatioPercentage: number;
  evaluations: AuditEvaluation[];
  keyStrengths: string[];
  identifiedDeficiencies: string[];
  suggestedRemediations: string[];
}

export interface IterationSnapshot {
  id: string;
  versionNumber: number;
  timestamp: string;
  name: string;
  inputs: AgentConfigurationInputs;
  result: OptimizationResult | null;
  optimizationMode: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  complianceNotes?: string;
  subprocessTrace?: SubprocessTraceStep[];
}

export interface AgentPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  isTeachingTemplate?: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Strict Safety' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Production Security';
  teachingLesson?: string;
  expectedPitfalls?: string[];
  recommendedTestProbe?: string;
  inputs: AgentConfigurationInputs;
}

export type ActivityLogType = 'OPTIMIZATION' | 'AUDIT' | 'TEST_PROBE' | 'TEMPLATE_LOAD' | 'ERROR';

export interface ActivityTestRecord {
  testName: string;
  outcome: 'PASS' | 'FAIL' | 'WARNING' | 'VERIFIED' | 'SUPPORTED_INFERENCE';
  detail: string;
}

export interface ActivityChangeRecord {
  area: string;
  before: string;
  after: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: ActivityLogType;
  title: string;
  inputText: string;
  outputText: string;
  whatChanged: ActivityChangeRecord[];
  whatFailed: string[];
  testingDone: ActivityTestRecord[];
  status: 'PASS' | 'WARNING' | 'FAIL';
}

export type WorkspaceTab = 'builder' | 'review' | 'audit' | 'simulator' | 'swarmex';

export interface DuxcmdPolicyConfig {
  $schema: string;
  agent: {
    name: string;
    version: string;
    role: string;
    mode: 'read_only' | 'restricted_write' | 'elevated';
  };
  execution_environment: {
    type: string;
    isolation_level: string;
    network_access: string;
    default_policy: string;
  };
  loop_policy?: {
    mode: 'SINGLE_PASS_ONLY';
    max_auto_adjust_loops: number;
    refuse_looped_code_mutation: boolean;
  };
  permissions: {
    file_system: {
      read: string[];
      write: string[];
      execute: string[];
    };
    tools: string[];
    ai_command_operations?: string[];
  };
  audit: {
    log_level: string;
    destination: string;
  };
}

export type EvidenceTier = 'Verified' | 'Supported Inference' | 'Unknown' | 'Disputed';

export interface SwarmexRepoFile {
  path: string;
  language: 'json' | 'markdown' | 'python' | 'bash';
  description: string;
  content: string;
}

export interface SwarmexActivityMetrics {
  policyChecksRun: number;
  gatewayDecisions: number;
  claimsClassified: number;
  bundleExported: boolean;
}

export interface WorkflowCompletionStatus {
  configureReadyCount: number;
  isConfigured: boolean;
  isOptimized: boolean;
  needsReoptimize: boolean;
  isAudited: boolean;
  auditHealthScore: number | null;
  probesExecuted: number;
  swarmexChecksCompleted: number;
}



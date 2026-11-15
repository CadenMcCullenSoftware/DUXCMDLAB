// Shared 5th-grade plain language cleaner and auto-redaction filter
// Runs identically in both the browser UI and Node Express API routes.

const PHRASE_SIMPLIFICATION_RULES: Array<[RegExp, string]> = [
  [/\bmulti-subprocess\b/gi, 'four-step'],
  [/\bsubprocesses\b/gi, 'helper steps'],
  [/\bsubprocess\b/gi, 'helper step'],
  [/\boperational boundaries\b/gi, 'strict limits'],
  [/\bexecution constraints\b/gi, 'hard rules'],
  [/\bworkflow sequence\b/gi, 'step order'],
  [/\bevidentiary tiers\b/gi, 'proof levels'],
  [/\bevidentiary tier\b/gi, 'proof level'],
  [/\bevidentiary\b/gi, 'proof'],
  [/\bsupported inference\b/gi, 'clue from files'],
  [/\bspeculative extrapolation\b/gi, 'wild guess'],
  [/\bspeculative assumptions?\b/gi, 'guesses'],
  [/\bspeculative\b/gi, 'guessing'],
  [/\bextrapolation\b/gi, 'guess'],
  [/\bhallucinated\b/gi, 'made-up'],
  [/\bhallucinations?\b/gi, 'made-up facts'],
  [/\bdeterministic\b/gi, 'always the same'],
  [/\bdeterminism\b/gi, 'same result every time'],
  [/\bremediations\b/gi, 'fixes'],
  [/\bremediation\b/gi, 'fix'],
  [/\binvariants\b/gi, 'strict rules'],
  [/\binvariant\b/gi, 'strict rule'],
  [/\borchestration\b/gi, 'team setup'],
  [/\borchestrator\b/gi, 'runner'],
  [/\borchestrated\b/gi, 'connected'],
  [/\barchitecture\b/gi, 'main plan'],
  [/\barchitectural\b/gi, 'main plan'],
  [/\barchitect\b/gi, 'builder'],
  [/\bspecifications\b/gi, 'rule sheets'],
  [/\bspecification\b/gi, 'rule sheet'],
  [/\bconfigurations\b/gi, 'setups'],
  [/\bconfiguration\b/gi, 'setup'],
  [/\bconfigure\b/gi, 'set up'],
  [/\bconfigured\b/gi, 'set up'],
  [/\bverification\b/gi, 'proof check'],
  [/\bverify\b/gi, 'check'],
  [/\bverified\b/gi, 'proven'],
  [/\bdiscrepancy\b/gi, 'mismatch'],
  [/\bdiscrepancies\b/gi, 'mismatches'],
  [/\bcompliance\b/gi, 'rule check'],
  [/\bcompliant\b/gi, 'follows rules'],
  [/\bauthorization\b/gi, 'approval'],
  [/\bauthorize\b/gi, 'approve'],
  [/\bauthorized\b/gi, 'approved'],
  [/\bescalation\b/gi, 'person check'],
  [/\bescalate\b/gi, 'ask a person'],
  [/\bescalated\b/gi, 'sent to person'],
  [/\bmalformed\b/gi, 'broken'],
  [/\badversarial\b/gi, 'tricky'],
  [/\bautonomous\b/gi, 'on its own'],
  [/\bautonomously\b/gi, 'on its own'],
  [/\brecursive\b/gi, 'repeating'],
  [/\bmutations\b/gi, 'changes'],
  [/\bmutation\b/gi, 'change'],
  [/\bmutating\b/gi, 'changing'],
  [/\bsynthesizer\b/gi, 'writer'],
  [/\bsynthesize\b/gi, 'build'],
  [/\bsynthesized\b/gi, 'built'],
  [/\binterpretations\b/gi, 'guesses'],
  [/\binterpretation\b/gi, 'guess'],
  [/\bdeficiencies\b/gi, 'missing parts'],
  [/\bdeficiency\b/gi, 'missing part'],
  [/\bcriteria\b/gi, 'rules'],
  [/\bcriterion\b/gi, 'rule'],
  [/\bmethodologies\b/gi, 'ways'],
  [/\bmethodology\b/gi, 'way'],
  [/\bempirically\b/gi, 'by real test'],
  [/\bempirical\b/gi, 'tested'],
  [/\butilizing\b/gi, 'using'],
  [/\butilize\b/gi, 'use'],
  [/\bmitigate\b/gi, 'fix'],
  [/\bmitigation\b/gi, 'fix'],
  [/\brepository\b/gi, 'folder'],
  [/\bartifacts\b/gi, 'files'],
  [/\bartifact\b/gi, 'file'],
  [/\bparameters\b/gi, 'inputs'],
  [/\bparameter\b/gi, 'input'],
  [/\bconstraints\b/gi, 'rules'],
  [/\bconstraint\b/gi, 'rule'],
  [/\bboundaries\b/gi, 'limits'],
  [/\bboundary\b/gi, 'limit'],
  [/\btelemetry\b/gi, 'status log'],
  [/\bpayloads\b/gi, 'inputs'],
  [/\bpayload\b/gi, 'input'],
  [/\bschemas\b/gi, 'shapes'],
  [/\bschema\b/gi, 'shape'],
  [/\bconversational\b/gi, 'chatty'],
  [/\bpleasantries\b/gi, 'small talk'],
  [/\brationale\b/gi, 'reason'],
  [/\bclassification\b/gi, 'group'],
  [/\bclassify\b/gi, 'sort'],
  [/\bclassified\b/gi, 'sorted'],
  [/\btaxonomy\b/gi, 'group list'],
  [/\bprivileged\b/gi, 'special'],
  [/\bexecutable\b/gi, 'runnable'],
  [/\bdiagnostic\b/gi, 'test check'],
  [/\bverbose\b/gi, 'detailed'],
  [/\baggregate\b/gi, 'total'],
  [/\bprioritize\b/gi, 'put first'],
  [/\bdeliverables\b/gi, 'final files'],
  [/\bdeliverable\b/gi, 'final file'],
  [/\bontologies\b/gi, 'word lists'],
  [/\bontology\b/gi, 'word list'],
  [/\bambiguous\b/gi, 'unclear'],
  [/\bambiguity\b/gi, 'unclear part'],
  [/\barbitrary\b/gi, 'random'],
  [/\bhedging\b/gi, 'guessing'],
  [/\brev\s*5\b/gi, '5'],
  [/\bidempotent\b/gi, 'safe to repeat'],
  [/\bconcatenated?\b/gi, 'join'],
  [/\bwrithing\b/gi, 'twisting'],
  [/\ballocation\b/gi, 'share'],
  [/\bprocedural\b/gi, 'step-by-step'],
  [/\bdisputed\b/gi, 'conflicting'],
  [/\bunexecuted\b/gi, 'not yet run'],
  [/\bunvalidated\b/gi, 'unchecked'],
  [/\btraceability\b/gi, 'step tracking'],
  [/\bsimulator\b/gi, 'live test'],
  [/\bsimulate\b/gi, 'test'],
  [/\bcapabilities\b/gi, 'skills'],
  [/\bcapability\b/gi, 'skill'],
  [/\bobjective\b/gi, 'goal'],
  [/\bobjectives\b/gi, 'goals'],
  [/\bconventional\b/gi, 'normal'],
  [/\bconventions\b/gi, 'style rules'],
  [/\bconvention\b/gi, 'style rule'],
  [/\bmandates?\b/gi, 'rule'],
  [/\binvocation\b/gi, 'run'],
  [/\binvoke\b/gi, 'run'],
  [/\bprohibited\b/gi, 'not allowed'],
  [/\bforbidden\b/gi, 'banned'],
  [/\brecommendations?\b/gi, 'next step'],
  [/\boptimization\b/gi, 'cleanup'],
  [/\boptimize\b/gi, 'clean up'],
  [/\boptimized\b/gi, 'cleaned up'],
  [/\boptimizer\b/gi, 'cleaner'],
  [/\bevaluations?\b/gi, 'check'],
  [/\bevaluate\b/gi, 'check'],
  [/\bevaluated\b/gi, 'checked'],
  [/\bdirectives?\b/gi, 'order'],
  [/\bassertions?\b/gi, 'claim'],
  [/\bassert\b/gi, 'say'],
  [/\banalyze\b/gi, 'check'],
  [/\banalysis\b/gi, 'check'],
  [/\banalytical\b/gi, 'fact-based'],
  [/\bperimeter\b/gi, 'fence'],
  [/\bisolation\b/gi, 'locked box'],
  [/\bsandbox\b/gi, 'safe box'],
  [/\bvolatile\b/gi, 'changing'],
  [/\bdeviations?\b/gi, 'mistake'],
  [/\bbottlenecks?\b/gi, 'slow spot'],
  [/\bidiomatically?\b/gi, 'clean'],
  [/\bidiomatic\b/gi, 'clean'],
  [/\brefactors?\b/gi, 'cleanup'],
  [/\binjection\b/gi, 'trick'],
  [/\bvulnerabilities\b/gi, 'weak spots'],
  [/\bvulnerability\b/gi, 'weak spot'],
  [/\bsequential\b/gi, 'in order'],
  [/\benumerate\b/gi, 'list'],
  [/\bsanitization\b/gi, 'cleaning'],
  [/\bsanitize\b/gi, 'clean'],
  [/\bcoercion\b/gi, 'type fix'],
  [/\bdeduplication\b/gi, 'removing copies'],
  [/\binterpreting\b/gi, 'guessing'],
  [/\binterpret\b/gi, 'guess'],
  [/\balgorithmic\b/gi, 'step-by-step'],
  [/\balgorithms?\b/gi, 'step rules'],
  [/\bbehavioral\b/gi, 'behavior'],
  [/\bdemeanor\b/gi, 'manner'],
  [/\btelemetry\b/gi, 'logs'],
  [/\benterprise\b/gi, 'large'],
  [/\bdiagnostic\b/gi, 'test check'],
  [/\bobviously\b/gi, 'clearly'],
  [/\bimmediately\b/gi, 'right away'],
  [/\bdisagreements\b/gi, 'conflicts'],
  [/\bdisagreement\b/gi, 'conflict'],
  [/\bungrounded\b/gi, 'unproven'],
];

const VAGUE_INTERPRETATION_RULES: Array<[RegExp, string]> = [
  [/\bas an ai language model\b/gi, '[REDACTED]'],
  [/\bas an ai\b/gi, '[REDACTED]'],
  [/\bit seems to work\b/gi, '[REDACTED]'],
  [/\bit appears likely\b/gi, '[REDACTED]'],
  [/\bappears to be\b/gi, '[REDACTED]'],
  [/\bone might interpret\b/gi, '[REDACTED]'],
  [/\bconceptually speaking\b/gi, '[REDACTED]'],
  [/\bhypothetically\b/gi, '[REDACTED]'],
  [/\barguably\b/gi, '[REDACTED]'],
  [/\bpresumably\b/gi, '[REDACTED]'],
  [/\bconceivably\b/gi, '[REDACTED]'],
  [/\bi believe\b/gi, '[REDACTED]'],
  [/\bi think\b/gi, '[REDACTED]'],
  [/\bi suspect\b/gi, '[REDACTED]'],
  [/\bi guess\b/gi, '[REDACTED]'],
  [/\bperhaps\b/gi, '[REDACTED]'],
  [/\bprobably\b/gi, '[REDACTED]'],
  [/\bassuming it passes\b/gi, '[REDACTED]'],
  [/\bin theory\b/gi, '[REDACTED]'],
  [/\bhope this helps!?/gi, ''],
  [/\bcertainly!/gi, ''],
];

// Core 5th-grade and plain everyday words (>=3 syllables or common functional terms allowed through)
const FIFTH_GRADE_WORDS = new Set([
  // Common 5th-grade 3+ syllable words
  'important', 'remember', 'remembered', 'understand', 'understands', 'understood', 'understandable',
  'understanding', 'explanation', 'explanations', 'instruction', 'instructions', 'direction', 'directions',
  'computer', 'computers', 'example', 'examples', 'different', 'difference', 'another', 'together',
  'continue', 'continues', 'continued', 'continuing', 'personal', 'story', 'stories',
  'commentary', 'opinion', 'opinions', 'narrative', 'statement', 'statements',
  'financial', 'mortgage', 'escrow', 'interest', 'equation', 'equations', 'calculate',
  'calculated', 'calculation', 'calculations', 'calculator', 'numerical', 'number', 'numbers',
  'addition', 'subtraction', 'multiply', 'division', 'accurate', 'accurately', 'accuracy',
  'following', 'remaining', 'including', 'excluded', 'excluding', 'incorrect', 'incomplete',
  'accepted', 'rejected', 'ignored', 'processed', 'processing', 'protected', 'protecting',
  'preventing', 'allowed', 'forbidden', 'possible', 'impossible', 'required', 'requires',
  'expected', 'unexpected', 'provided', 'provides', 'recorded', 'redacted', 'replaced', 'replacing',
  'repeating', 'conflicting', 'everything', 'everywhere', 'everyone', 'anything', 'anyone',
  'someone', 'something', 'nobody', 'nothing', 'nowhere', 'correctly', 'carefully', 'clearly',
  'directly', 'actually', 'usually', 'normally', 'especially', 'completely', 'already', 'always',
  'never', 'sometimes', 'however', 'because', 'between', 'without', 'outside', 'inside',
  'before', 'after', 'during', 'through', 'against', 'several', 'certain', 'simple', 'simpler',
  'simplest', 'simply', 'easier', 'easiest', 'easily', 'harder', 'hardest', 'clearer', 'clearest',
  'shortest', 'smaller', 'smallest', 'bigger', 'biggest', 'longer', 'longest', 'higher', 'highest',
  'lower', 'lowest', 'better', 'best', 'worse', 'worst', 'faster', 'fastest', 'slower',
  'attention', 'question', 'questions', 'answer', 'answers', 'reason', 'reasons', 'reasoning',
  'summary', 'activity', 'activities', 'document', 'documents', 'history', 'template',
  'templates', 'lesson', 'lessons', 'preset', 'presets', 'builder', 'compare', 'compared',
  'comparing', 'comparison', 'checker', 'checking', 'checked', 'testing', 'tested', 'untested',
  'waiting', 'walking', 'talking', 'running', 'working', 'helping', 'reading', 'writing',
  'saving', 'loading', 'showing', 'hiding', 'opening', 'closing', 'stopping', 'starting',
  'keeping', 'making', 'using', 'trying', 'putting', 'getting', 'looking', 'seeing',
  'sending', 'giving', 'taking', 'coming', 'going', 'finding', 'telling', 'asking', 'saying',
  'feeling', 'frustrated', 'favorite', 'yesterday', 'behavior', 'human', 'person', 'people',
  'operator', 'operation', 'operations', 'approval', 'approved', 'unapproved', 'denied',
  'blocked', 'passed', 'failed', 'warning', 'critical', 'unknown', 'proven', 'gateway',
  'policy', 'policies', 'terminal', 'console', 'browser', 'server', 'client', 'local',
  'storage', 'system', 'systems', 'power', 'compute', 'resource', 'resources', 'value', 'values',
  'amount', 'amounts', 'total', 'totals', 'balance', 'balances', 'ledger', 'invoice', 'tax',
  'return', 'returns', 'income', 'percent', 'percentage', 'score', 'scores', 'level', 'levels',
  'grade', 'fifth', 'first', 'second', 'third', 'fourth', 'step', 'steps', 'helper', 'helpers',
  'limit', 'limits', 'limited', 'rule', 'rules', 'strict', 'strictly', 'hard', 'safety', 'safe',
  'check', 'checks', 'proof', 'proofs', 'clue', 'clues', 'fact', 'facts', 'factual',
  'non-factual', 'real', 'exact', 'exactly', 'short', 'plain', 'word', 'words', 'term',
  'terms', 'language', 'sentence', 'sentences', 'paragraph', 'vocab', 'english', 'letter',
  'letters', 'heading', 'headings', 'section', 'sections', 'button', 'buttons', 'drawer',
  'drawers', 'panel', 'panels', 'table', 'tables', 'column', 'columns', 'row', 'rows',
  'field', 'fields', 'form', 'forms', 'box', 'boxes', 'card', 'cards', 'list', 'lists',
  'item', 'items', 'line', 'lines', 'page', 'pages', 'screen', 'screens', 'modal', 'menu',
  'menus', 'toggle', 'filter', 'search', 'copy', 'copied', 'download', 'downloaded', 'export',
  'exported', 'import', 'imported', 'reset', 'clear', 'cleared', 'clean', 'cleaned', 'cleaner',
  'redact', 'redacts', 'replace', 'swap', 'swapped', 'change', 'changes', 'changed', 'edit',
  'edited', 'update', 'updated', 'updates', 'save', 'saved', 'load', 'loaded', 'restore',
  'restored', 'build', 'built', 'compile', 'compiled', 'audit', 'audited', 'test', 'tests',
  'probe', 'probes', 'trace', 'traced', 'traces', 'event', 'events', 'entry', 'entries',
  'output', 'outputs', 'input', 'inputs', 'result', 'results', 'reply', 'replies', 'message',
  'messages', 'request', 'requests', 'response', 'responses', 'prompt', 'prompts', 'draft',
  'drafts', 'goal', 'goals', 'task', 'tasks', 'plan', 'plans', 'order', 'orders', 'action',
  'actions', 'status', 'report', 'reports', 'detail', 'details', 'note', 'notes', 'hint',
  'hints', 'error', 'errors', 'mistake', 'mistakes', 'problem', 'problems', 'fix', 'fixes',
  'fixed', 'patch', 'patches', 'diff', 'diffs', 'file', 'files', 'folder', 'folders', 'code',
  'logic', 'math', 'digit', 'digits', 'money', 'dollar', 'dollars', 'rate', 'rates', 'price',
  'prices', 'cost', 'costs', 'count', 'counts', 'counted', 'timer', 'minute', 'minutes',
  'today', 'ready', 'pending', 'active', 'broken', 'empty', 'brief', 'detailed', 'complete',
  'completed', 'finished', 'done', 'pass', 'fail', 'skip', 'skipped', 'block', 'halt', 'halted',
  'pause', 'paused', 'stop', 'stopped', 'allow', 'deny', 'refuse', 'refused', 'reject',
  'accept', 'ignore', 'process', 'verify', 'reason', 'brain', 'model', 'engine', 'agent',
  'agents', 'tool', 'tools', 'command', 'commands', 'single', 'double', 'zero', 'hundred',
  'thousand', 'million', 'negative', 'positive', 'true', 'false', 'valid', 'invalid', 'missing',
  'present', 'absent', 'extra', 'fluff', 'filler', 'guess', 'guesses', 'guessing', 'unclear',
  'confusing', 'confused', 'functional', 'working', 'meaning', 'everyday', 'normal', 'standard',
  'standards', 'special', 'private', 'public', 'shared', 'general', 'common', 'specific',
  'official', 'original', 'previous', 'current', 'latest', 'recent', 'modern', 'future',
  'automatic', 'automatically', 'manually', 'manual', 'visible', 'hidden', 'readonly', 'sandbox',
  'swarmex', 'duxcmd', 'markdown', 'gemini', 'hydrogen', 'typescript', 'python', 'javascript',
  'react', 'express', 'postgres', 'postgresql', 'sqlite', 'character', 'characters', 'physical',
  'grounded', 'established', 'minimum', 'maximum', 'violation', 'security', 'allocation',
  'unexplained', 'unexplainable', 'explainable', 'monitoring', 'protection', 'condition',
  'conditions', 'connection', 'connections', 'permission', 'permissions', 'directory',
  'destination', 'information', 'education', 'experience', 'similar', 'suddenly', 'finally',
  'quickly', 'slowly', 'loudly', 'quietly', 'friendly', 'helpful', 'unhelpful', 'useless',
  'useful', 'dangerous', 'harmful', 'harmless', 'category', 'separate', 'separated', 'solution',
  'solutions', 'suggestion', 'suggestions', 'database', 'password', 'company', 'customer',
  'billing', 'account', 'accounts', 'underline', 'unfinished', 'unwanted', 'untrusted', 'disagree',
  'execution', 'executed', 'execute', 'snapshot', 'snapshots', 'version', 'program', 'programs',
  'every', 'whatever', 'uppercase', 'lowercase', 'nicely', 'silent', 'silently', 'opposite',
  'decision', 'decisions', 'disagree', 'background', 'reminder', 'reminders', 'production',
  'duplicate', 'duplicates', 'practical', 'transaction', 'transactions', 'refusal', 'refusals',
  'tolerance', 'modify', 'modifying', 'proposal', 'proposals', 'override', 'validation',
  'validate', 'confirm', 'confirmation', 'immediate', 'roleplay', 'researcher', 'openapi',
  'evidence', 'persona', 'personas', 'conflict', 'conflicts', 'removal', 'remove', 'removed',
  'clarity', 'unproven', 'explicit', 'requirement', 'requirements', 'context', 'technical',
  'external', 'protocol', 'verifiable', 'profiling', 'characteristics', 'factual', 'structured',
  'accessible', 'reference', 'references', 'consistent', 'consistency', 'preamble', 'ambient',
  'deviation', 'misinformation', 'publicly',
]);

// Known complex academic / AI jargon words (even 2-3 syllables) that must be auto-redacted if unmapped
const COMPLEX_UNEXPLAINABLE_WORDS = new Set([
  'epistemological', 'ontology', 'ontologies', 'heuristic', 'heuristics', 'polymorphic',
  'orthogonality', 'idempotency', 'stochastic', 'asymptotic', 'pharmacokinetic',
  'heterogeneous', 'deterministic', 'nondeterministic', 'extrapolation', 'concatenation',
  'taxonomy', 'invariant', 'invariants', 'subprocesses', 'remediation', 'speculative',
  'hallucination', 'hallucinated', 'paradigm', 'pragmatic', 'epistemic', 'hermeneutic',
  'syntactic', 'semantic', 'axiomatic', 'telemetry', 'methodology', 'reconciliation',
  'canonical', 'disambiguate', 'instantiation', 'encapsulation', 'introspection',
  'cybernetic', 'probabilistic', 'phenomenological', 'metaphysical', 'choreography',
]);

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const matches = trimmed.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function isSimpleFifthGradeWord(rawWord: string): boolean {
  const lower = rawWord.toLowerCase();
  if (lower.length <= 4) return true;
  if (COMPLEX_UNEXPLAINABLE_WORDS.has(lower)) return false;
  if (FIFTH_GRADE_WORDS.has(lower)) return true;

  // Check common inflectional bases
  const stems = [
    lower.replace(/ies$/, 'y'),
    lower.replace(/ied$/, 'y'),
    lower.replace(/ves$/, 'f'),
    lower.replace(/s$/, ''),
    lower.replace(/es$/, ''),
    lower.replace(/ed$/, ''),
    lower.replace(/ed$/, 'e'),
    lower.replace(/ing$/, ''),
    lower.replace(/ing$/, 'e'),
    lower.replace(/er$/, ''),
    lower.replace(/est$/, ''),
    lower.replace(/ly$/, ''),
  ];
  if (stems.some((s) => s.length >= 2 && FIFTH_GRADE_WORDS.has(s))) {
    return true;
  }

  // Words of <= 2 syllables that aren't flagged complex are generally readable at 5th-grade level
  const syllables = countSyllables(lower);
  if (syllables <= 2 && lower.length <= 9) {
    return true;
  }

  return false;
}

export interface VocabularyAuditStats {
  cleanedText: string;
  jargonSwappedCount: number;
  redactionCount: number;
}

/**
 * Replaces complex jargon with 5th-grade plain words, removes unclear AI guesses,
 * and auto-redacts any leftover complex words that cannot be explained simply as [REDACTED].
 */
export function inspectAndCleanVocabulary(input: string): VocabularyAuditStats {
  if (!input || typeof input !== 'string') {
    return { cleanedText: input || '', jargonSwappedCount: 0, redactionCount: 0 };
  }

  let text = input;
  let jargonSwappedCount = 0;
  let redactionCount = 0;

  // Protect URLs so phrase rules (e.g., schema -> shape) never corrupt verifiable web links
  const savedUrls: string[] = [];
  text = text.replace(/https?:\/\/[^\s"'`<>]+/g, (url) => {
    const idx = savedUrls.length;
    savedUrls.push(url);
    return `__PRESERVED_URL_${idx}__`;
  });

  // Step 1: Strip vague AI guesses / filler interpretations
  for (const [pattern, replacement] of VAGUE_INTERPRETATION_RULES) {
    text = text.replace(pattern, () => {
      if (replacement === '[REDACTED]') redactionCount++;
      else jargonSwappedCount++;
      return replacement;
    });
  }

  // Step 2: Swap known jargon for plain 5th-grade phrases
  for (const [pattern, replacement] of PHRASE_SIMPLIFICATION_RULES) {
    text = text.replace(pattern, (match) => {
      jargonSwappedCount++;
      // Match capitalized leading letter if original started uppercase and replacement starts lowercase
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  // Step 3: Word-by-word 5th-grade check preserving technical command tokens, URLs, paths, snake_case IDs, and [REDACTED]
  text = text.replace(/(`[^`]+`|__PRESERVED_URL_\d+__|https?:\/\/[^\s"'`]+|cmd:[a-z0-9_]+|(?:\/|[a-zA-Z0-9_.-]+\/)[a-zA-Z0-9._\-\/]+|[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+|\[REDACTED\]|[A-Za-z]+(?:'[A-Za-z]+)?)/g, (token) => {
    // Keep inline code, URLs, typed command tags, paths, snake_case/constant identifiers, and existing [REDACTED] tokens untouched
    if (
      token.startsWith('`') ||
      token.startsWith('__PRESERVED_URL_') ||
      token.startsWith('http://') ||
      token.startsWith('https://') ||
      token.startsWith('cmd:') ||
      token.includes('/') ||
      token.includes('_') ||
      token === '[REDACTED]' ||
      token === 'TechnicalResponsePayload'
    ) {
      return token;
    }

    // Keep contractions intact if base is simple
    const baseWord = token.replace(/'[a-z]+$/i, '');
    if (/^[A-Z]{2,6}$/.test(token)) {
      // Short known acronyms like SQL, JSON, HTTP, CLI, PASS, FAIL, WARN, ZERO
      if (/^(SQL|JSON|HTTP|HTTPS|CLI|API|UI|ID|URL|PASS|FAIL|WARN|ZERO|VM|OK|UTC|ISO|HTML|YAML)$/.test(token)) {
        return token;
      }
    }

    if (isSimpleFifthGradeWord(baseWord)) {
      return token;
    }

    redactionCount++;
    return '[REDACTED]';
  });

  // Restore exact protected URLs untouched
  text = text.replace(/__PRESERVED_URL_(\d+)__/g, (_m, idxStr) => savedUrls[Number(idxStr)] ?? '');

  // Clean duplicate spaces created by removed filler phrases without collapsing line breaks
  text = text.replace(/[ \t]{2,}/g, ' ').replace(/ +([.,!?;:])/g, '$1').trim();

  return {
    cleanedText: text,
    jargonSwappedCount,
    redactionCount,
  };
}

function cleanJsonValuePreservingSchema(val: unknown): unknown {
  if (typeof val === 'string') {
    return inspectAndCleanVocabulary(val).cleanedText;
  }
  if (Array.isArray(val)) {
    return val.map((item) => cleanJsonValuePreservingSchema(item));
  }
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = cleanJsonValuePreservingSchema(v);
    }
    return out;
  }
  return val;
}

export function simplifyAndRedactText(input: string): string {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        ('explicit requirements' in parsed || 'response_data' in parsed || '$schema' in parsed)
      ) {
        return JSON.stringify(cleanJsonValuePreservingSchema(parsed), null, 2);
      }
    } catch {
      // Fall through to plain text cleaner
    }
  }
  return inspectAndCleanVocabulary(input).cleanedText;
}

export function simplifyAndRedactObject<T>(value: T): T {
  if (typeof value === 'string') {
    return simplifyAndRedactText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => simplifyAndRedactObject(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // Preserve raw system fields like timestamps, IDs, commandOp strings, and status enums cleanly
      if (
        k === 'id' ||
        k === 'timestamp' ||
        k === 'commandOp' ||
        k === 'status' ||
        k === 'subprocessId' ||
        k === 'resourceAllocation' ||
        k === 'driftRiskLevel'
      ) {
        out[k] = v;
      } else {
        out[k] = simplifyAndRedactObject(v);
      }
    }
    return out as T;
  }
  return value;
}

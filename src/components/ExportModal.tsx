import React, { useState } from 'react';
import { OptimizationResult, AgentConfigurationInputs } from '../types/agent';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Code2,
  FileJson,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: OptimizationResult | null;
  inputs: AgentConfigurationInputs;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  result,
  inputs,
}) => {
  const [exportFormat, setExportFormat] = useState<'raw' | 'markdown' | 'json' | 'ts' | 'python'>('markdown');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const agentName = simplifyAndRedactText(result?.agentTitle || 'Simple Safe Agent');
  const systemPrompt = simplifyAndRedactText(result?.compiledSystemInstruction || '');

  const getExportContent = () => {
    switch (exportFormat) {
      case 'raw':
        return systemPrompt;
      case 'markdown':
        return simplifyAndRedactText(`# ${agentName} — Simple Rule Sheet

> ${result?.executiveSummary || 'Built with simple 5th-grade safety rules'}

## Main System Rules
\`\`\`text
${systemPrompt}
\`\`\`

## Four Core Parts
### 1. Main Goal
- **Main Goal**: ${result?.refinedSections?.roleObjectives?.primaryObjective || inputs.roleObjectives.primaryObjective}
- **Daily Tasks**: ${result?.refinedSections?.roleObjectives?.primaryTasks || inputs.roleObjectives.primaryTasks}
- **Final Output**: ${result?.refinedSections?.roleObjectives?.finalOutputs || inputs.roleObjectives.finalOutputs}
- **Pass Rules**: ${result?.refinedSections?.roleObjectives?.successMetrics || inputs.roleObjectives.successMetrics}

### 2. Limits & Safety Rules
- **Safe Limits**: ${result?.refinedSections?.systemArchitecture?.operationalBoundaries || inputs.systemArchitecture.operationalBoundaries}
- **Hard Rules**: ${result?.refinedSections?.systemArchitecture?.executionConstraints || inputs.systemArchitecture.executionConstraints}
- **Step Order**: ${result?.refinedSections?.systemArchitecture?.workflowSequence || inputs.systemArchitecture.workflowSequence}
- **Stop Rules**: ${result?.refinedSections?.systemArchitecture?.edgeCases || inputs.systemArchitecture.edgeCases}

### 3. Facts & Standards
- **Skills**: ${result?.refinedSections?.domainExpertise?.technicalCapabilities || inputs.domainExpertise.technicalCapabilities}
- **Standards**: ${result?.refinedSections?.domainExpertise?.referenceStandards || inputs.domainExpertise.referenceStandards}

### 4. Voice & Output Shape
- **Shortness**: ${result?.refinedSections?.personaInteraction?.communicationRegister || inputs.personaInteraction.communicationRegister}
- **Banned Words**: ${result?.refinedSections?.personaInteraction?.forbiddenPhrasing || inputs.personaInteraction.forbiddenPhrasing}
`);
      case 'json':
        return JSON.stringify(
          {
            agentName,
            summary: simplifyAndRedactText(result?.executiveSummary || ''),
            compiledSystemInstruction: systemPrompt,
            configuration: result?.refinedSections || inputs,
            auditReport: result?.auditReport,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
      case 'ts':
        return `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const systemInstruction = ${JSON.stringify(systemPrompt)};

export async function runAgent(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
    },
  });

  return response.text;
}
`;
      case 'python':
        return `import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

system_instruction = """${systemPrompt.replace(/"""/g, '\\"\\"\\"')}"""

def run_agent(prompt: str) -> str:
    response = client.models.generate_content(
        model="gemini-4-hydrogen",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction
        )
    )
    return response.text
`;
      default:
        return systemPrompt;
    }
  };

  const content = getExportContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${agentName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${
      exportFormat === 'json' ? 'json' : exportFormat === 'ts' ? 'ts' : exportFormat === 'python' ? 'py' : 'md'
    }`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Export Rules &amp; Code
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Clean formats ready to copy or save into your project.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-850 overflow-x-auto">
          <button
            onClick={() => setExportFormat('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              exportFormat === 'markdown'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown Sheet</span>
          </button>

          <button
            onClick={() => setExportFormat('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              exportFormat === 'raw'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <span>Plain Rules Text</span>
          </button>

          <button
            onClick={() => setExportFormat('ts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              exportFormat === 'ts'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>TypeScript (@google/genai)</span>
          </button>

          <button
            onClick={() => setExportFormat('python')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              exportFormat === 'python'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python (google-genai)</span>
          </button>

          <button
            onClick={() => setExportFormat('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              exportFormat === 'json'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON File</span>
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 p-6 overflow-y-auto">
          <pre className="p-4 bg-neutral-950 text-neutral-200 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap select-text border border-neutral-800 max-h-[500px] overflow-y-auto">
            {content}
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900">
          <div className="text-xs text-neutral-500 font-mono tabular-nums">
            {content.length} chars · {content.split('\n').length} lines
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-neutral-400 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

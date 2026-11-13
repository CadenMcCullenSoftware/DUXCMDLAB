import React from 'react';
import { IterationSnapshot } from '../types/agent';
import { simplifyAndRedactText } from '../utils/simpleVocabulary';
import {
  X,
  History,
  RotateCcw,
  Calendar,
} from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: IterationSnapshot[];
  onRestoreSnapshot: (snapshot: IterationSnapshot) => void;
  currentVersion: number;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRestoreSnapshot,
  currentVersion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Saved Draft History
              </h2>
              <p className="text-xs text-neutral-500">
                Saves a copy each time you build rules so you can go back anytime.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshots List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {snapshots.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-500">
              No saved copies yet. Copies are saved every time you click Build Rules.
            </div>
          ) : (
            snapshots.map((snap) => {
              const isCurrent = snap.versionNumber === currentVersion;
              return (
                <div
                  key={snap.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-850 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {simplifyAndRedactText(snap.name || `Draft v${snap.versionNumber}`)}
                        </span>
                        {isCurrent && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            (Active Draft)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {snap.timestamp}
                        </span>
                        <span>·</span>
                        <span>Style: {snap.optimizationMode}</span>
                        {snap.result?.auditReport && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {snap.result.auditReport.intentPreservationScore}% Goal Kept
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1 pt-1">
                        {simplifyAndRedactText(snap.inputs.roleObjectives.primaryObjective)}
                      </p>
                    </div>

                    <div className="shrink-0 pt-1">
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onRestoreSnapshot(snap);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-neutral-400 transition-colors shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

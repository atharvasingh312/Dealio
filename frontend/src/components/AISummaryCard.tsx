"use client";

import { addActivity, generateSummary } from "@/lib/api";
import type { Activity, AISummary, AISummaryResult } from "@/lib/api";
import { useEffect, useState } from "react";

interface AISummaryCardProps {
  leadId: number;
  existingSummary: AISummary | null;
  onSummaryGenerated: (summary: AISummary) => void;
  onTaskAdded?: (activity: Activity) => void;
}

function isError(result: AISummaryResult): result is { error: string } {
  return "error" in result;
}

export default function AISummaryCard({
  leadId,
  existingSummary,
  onSummaryGenerated,
  onTaskAdded,
}: AISummaryCardProps) {
  const [summary, setSummary] = useState<AISummary | null>(existingSummary);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskAdded, setTaskAdded] = useState(false);

  useEffect(() => {
    setSummary(existingSummary);
  }, [existingSummary]);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateSummary(leadId);
      if (isError(result)) {
        setError("⚠️ AI Summary temporarily unavailable. Please review raw activity history below.");
      } else {
        setSummary(result);
        onSummaryGenerated(result);
      }
    } catch (err) {
      console.error("Summary generation failed:", err);
      setError("⚠️ AI Summary temporarily unavailable. Please review raw activity history below.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddToTasks() {
    if (!summary?.suggested_next_step || isAddingTask) return;
    setIsAddingTask(true);
    try {
      const newActivity = await addActivity(leadId, {
        type: "task",
        content: summary.suggested_next_step,
      });
      setTaskAdded(true);
      if (onTaskAdded) {
        onTaskAdded(newActivity);
      }
      setTimeout(() => setTaskAdded(false), 3000);
    } catch (err) {
      console.error("Failed to add AI suggested task:", err);
    } finally {
      setIsAddingTask(false);
    }
  }

  const getIntentStyle = (intent?: string) => {
    if (!intent) return "bg-gray-700 text-gray-300";
    const lower = intent.toLowerCase();
    if (lower.includes("high")) return "bg-green-100 text-green-700";
    if (lower.includes("warming")) return "bg-orange-100 text-orange-700";
    if (lower.includes("researching")) return "bg-blue-100 text-blue-700";
    return "bg-gray-700 text-gray-300";
  };

  return (
    <div className="card-dark p-6 shadow-md" id="ai-summary-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg leading-none">✦</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Dealio AI intelligence
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Signals synthesized from emails, calls, and CRM activity
            </p>
          </div>
        </div>

        {/* Generate / Refresh button */}
        <button
          id="generate-summary-btn"
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <span className="text-purple-600">✦</span>
              {summary && summary.is_stale ? "Update AI Summary" : "Generate AI Summary"}
            </>
          )}
        </button>
      </div>

      {/* Amber Fallback Banner */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/50 text-amber-200 text-sm flex items-center gap-2.5 shadow-sm animate-fade-in">
          <span className="text-base flex-shrink-0">⚠️</span>
          <span>AI Summary temporarily unavailable. Please review raw activity history below.</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-3 w-20 bg-gray-700 rounded mb-4" />
              <div className="h-3 w-full bg-gray-700 rounded mb-2" />
              <div className="h-3 w-3/4 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {summary && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Background */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Background
              </h3>
              <p className="text-sm text-gray-200 leading-relaxed">
                {summary.background}
              </p>
            </div>

            {/* Intent Signal */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Intent Signal
              </h3>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${getIntentStyle(summary.intent_signal)}`}>
                <span>✦</span>
                {summary.intent_signal.replace(/intent/i, 'intent')}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                Recent behavior indicates strong purchasing intent.
              </p>
            </div>

            {/* Missing Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Missing Info
              </h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Warning
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {summary.missing_info}
              </p>
            </div>
          </div>

          {/* AI Suggested Next Step banner */}
          {summary.suggested_next_step && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-gray-900/90 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-base flex-shrink-0">
                  💡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                      Suggested Next Step
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 font-medium">
                      AI Action
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-100 mt-0.5">
                    {summary.suggested_next_step}
                  </p>
                </div>
              </div>
              <button
                id="add-suggested-task-btn"
                onClick={handleAddToTasks}
                disabled={isAddingTask || taskAdded}
                className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  taskAdded
                    ? "bg-green-600/20 border border-green-500/40 text-green-300 cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                }`}
              >
                {isAddingTask ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : taskAdded ? (
                  <>
                    <span>✓</span>
                    <span>Added to Tasks</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold">＋</span>
                    <span>Add to Tasks</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!summary && !isLoading && !error && (
        <div className="text-center py-6 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-sm text-gray-400">
            Click &quot;Generate AI Summary&quot; to synthesize lead signals.
          </p>
        </div>
      )}
    </div>
  );
}

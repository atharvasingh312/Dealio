"use client";

import { updateStage } from "@/lib/api";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won"] as const;

interface PipelineStepperProps {
  leadId: number;
  currentStage: string;
  onStageChange: (newStage: string) => void;
}

export default function PipelineStepper({
  leadId,
  currentStage,
  onStageChange,
}: PipelineStepperProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const isLost = currentStage === "Lost";

  const currentIndex = PIPELINE_STAGES.indexOf(
    currentStage as (typeof PIPELINE_STAGES)[number],
  );

  async function handleStageClick(stage: string) {
    if (stage === currentStage || isUpdating) return;
    setIsUpdating(stage);
    try {
      await updateStage(leadId, stage);
      onStageChange(stage);
    } catch (err) {
      console.error("Failed to update stage:", err);
    } finally {
      setIsUpdating(null);
    }
  }

  return (
    <div className="card-white p-6" id="pipeline-stepper">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">
          Deal pipeline
        </h2>
        <span className="text-xs text-gray-400 font-medium">Updated yesterday</span>
      </div>

      {/* Stage stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage, index) => {
          const isPast = !isLost && index < currentIndex;
          const isCurrent = !isLost && stage === currentStage;
          const isFuture = !isLost && index > currentIndex;

          return (
            <div key={stage} className="flex items-center gap-2 flex-shrink-0">
              <button
                id={`stage-${stage.toLowerCase()}`}
                onClick={() => handleStageClick(stage)}
                disabled={isUpdating !== null}
                className={`
                  flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer
                  ${isCurrent ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400/40" : "bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"}
                  ${isPast ? "bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100" : ""}
                  ${isUpdating === stage ? "opacity-60 scale-95" : "hover:scale-[1.02] active:scale-95"}
                  ${isLost ? "opacity-40" : ""}
                  disabled:cursor-not-allowed
                `}
              >
                <span className={`${isCurrent ? "text-indigo-200 font-extrabold" : isPast ? "text-indigo-500 font-bold" : "text-gray-400 font-bold"}`}>
                  {index + 1}
                </span>
                <span>{stage}</span>
              </button>

              {/* Chevron separator */}
              {index < PIPELINE_STAGES.length - 1 && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Lost state toggle */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {isLost
            ? "This deal was marked as lost."
            : "Mark this deal as lost if it's no longer viable."}
        </span>
        <button
          id="stage-lost"
          onClick={() => handleStageClick("Lost")}
          disabled={isLost || isUpdating !== null}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium transition-colors
            ${
              isLost
                ? "bg-red-50 text-red-600 cursor-default border border-red-200"
                : "bg-white text-red-500 border border-red-200 hover:bg-red-50"
            }
            disabled:cursor-not-allowed
          `}
        >
          {isLost ? "Lost" : "Mark as Lost"}
        </button>
      </div>
    </div>
  );
}

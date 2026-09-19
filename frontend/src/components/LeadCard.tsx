"use client";

import Link from "next/link";
import type { Lead } from "@/lib/api";

// ---------------------------------------------------------------------------
// Stage colors
// ---------------------------------------------------------------------------

const STAGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  New: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  Contacted: { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  Qualified: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  Proposal: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  Won: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  Lost: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LeadCardProps {
  lead: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
  const style = STAGE_STYLES[lead.stage] ?? STAGE_STYLES.New;

  return (
    <Link href={`/leads/${lead.id}`} id={`lead-card-${lead.id}`}>
      <div className="glass gradient-border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/5 cursor-pointer group">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white truncate group-hover:text-primary-300 transition-colors">
              {lead.name}
            </h3>
            <p className="text-sm text-surface-200/60 truncate mt-0.5">
              {lead.company}
            </p>
          </div>
          {/* Stage badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} shrink-0 ml-3`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {lead.stage}
          </span>
        </div>

        {/* Value */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div>
            <p className="text-xs text-surface-200/40 uppercase tracking-wider font-medium">
              Deal Value
            </p>
            <p className="text-lg font-bold bg-gradient-to-r from-white to-surface-200/80 bg-clip-text text-transparent mt-0.5">
              ${lead.value.toLocaleString()}
            </p>
          </div>
          {/* Arrow icon */}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-surface-200/40 group-hover:text-primary-400 transition-colors"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

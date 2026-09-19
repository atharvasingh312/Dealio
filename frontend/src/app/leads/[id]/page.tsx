"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { addActivity, getLead } from "@/lib/api";
import type { LeadDetail, Activity, AISummary } from "@/lib/api";
import PipelineStepper from "@/components/PipelineStepper";
import ActivityFeed from "@/components/ActivityFeed";
import AISummaryCard from "@/components/AISummaryCard";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichSuccess, setEnrichSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLead(parseInt(id));
        setLead(data);
      } catch (err) {
        setError("Lead not found.");
        console.error("Failed to load lead:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  // Mocked Searchio AI Enrichment
  async function handleSearchioEnrich() {
    if (isEnriching || !lead) return;
    setIsEnriching(true);
    try {
      // 1. Simulated 1.2-second web scanning delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 2. Add structured web-search activity note
      await addActivity(lead.id, {
        type: "note",
        content:
          "🔍 Searchio Intelligence: Verified company size (250+ employees), identified CFO as budget approver, and confirmed recent Series B funding.",
      });

      // 3. Simultaneously create automated follow-up task
      await addActivity(lead.id, {
        type: "task",
        content: "Verify CFO email via Searchio enrichment",
      });

      // 4. Re-fetch lead activities and state dynamically
      const updatedLead = await getLead(lead.id);
      setLead(updatedLead);

      setEnrichSuccess(true);
      setTimeout(() => setEnrichSuccess(false), 3000);
    } catch (err) {
      console.error("Searchio enrichment failed:", err);
    } finally {
      setIsEnriching(false);
    }
  }

  // Callbacks
  function handleStageChange(newStage: string) {
    if (!lead) return;
    setLead({
      ...lead,
      stage: newStage,
      ai_summary: lead.ai_summary
        ? { ...lead.ai_summary, is_stale: true }
        : null,
    });
  }

  function handleActivityAdded(activity: Activity) {
    if (!lead) return;
    setLead({
      ...lead,
      activities: [activity, ...lead.activities],
      ai_summary: lead.ai_summary
        ? { ...lead.ai_summary, is_stale: true }
        : null,
    });
  }

  function handleActivityToggled(updated: Activity) {
    if (!lead) return;
    setLead({
      ...lead,
      activities: lead.activities.map((a) =>
        a.id === updated.id ? updated : a,
      ),
    });
  }

  function handleSummaryGenerated(summary: AISummary) {
    if (!lead) return;
    setLead({ ...lead, ai_summary: summary });
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
        <div className="animate-shimmer h-4 w-48 rounded mb-6" />
        <div className="card-white p-6 mb-6 h-32 animate-shimmer" />
        <div className="card-dark p-6 h-40 animate-shimmer" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <p className="text-gray-500 mb-4">{error || "Something went wrong."}</p>
        <Link href="/dashboard" className="text-blue-500 text-sm hover:underline">
          &larr; Back to dashboard
        </Link>
      </div>
    );
  }

  // Generate initials
  const initials = lead.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-12">
      {/* ── Breadcrumbs ── */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Leads</Link>
        <span>&gt;</span>
        <span className="font-medium text-gray-900">{lead.name}</span>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        {/* Left side: Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold border border-indigo-100">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-semibold text-gray-900 mb-0.5">{lead.name}</h1>
              {/* Searchio AI Enrichment Button */}
              <button
                id="searchio-enrich-btn"
                onClick={handleSearchioEnrich}
                disabled={isEnriching}
                className={`
                  inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm
                  ${
                    isEnriching
                      ? "bg-purple-50 text-purple-700 border border-purple-300 cursor-wait shadow-inner"
                      : enrichSuccess
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : "bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-700 border border-indigo-200/80 hover:border-indigo-300 cursor-pointer active:scale-95"
                  }
                `}
              >
                {isEnriching ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin" />
                    <span>Searchio scanning web for account insights &amp; POCs...</span>
                  </>
                ) : enrichSuccess ? (
                  <>
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Searchio Enriched</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">🔍</span>
                    <span>Enrich with Searchio AI</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">VP of Revenue Operations - {lead.company}</p>
          </div>
        </div>

        {/* Right side: Values & Actions */}
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deal Value</p>
            <p className="text-2xl font-bold text-gray-900">${lead.value.toLocaleString()}</p>
          </div>
          <div className="hidden sm:block text-sm text-gray-500 text-right">
            <p className="mb-0.5">{lead.name.split(' ')[0].toLowerCase()}.{lead.name.split(' ')[1]?.toLowerCase()}@{lead.company.toLowerCase().replace(/\s+/g, '')}.com</p>
            <p>+1 (415) 555-0184 · San Francisco, CA</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email lead
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="space-y-6">
        {/* AI Summary */}
        <AISummaryCard
          leadId={lead.id}
          existingSummary={lead.ai_summary}
          onSummaryGenerated={handleSummaryGenerated}
          onTaskAdded={handleActivityAdded}
        />

        {/* Pipeline */}
        <PipelineStepper
          leadId={lead.id}
          currentStage={lead.stage}
          onStageChange={handleStageChange}
        />

        {/* Activities & Tasks */}
        <ActivityFeed
          leadId={lead.id}
          activities={lead.activities}
          onActivityAdded={handleActivityAdded}
          onActivityToggled={handleActivityToggled}
        />
      </div>
    </div>
  );
}

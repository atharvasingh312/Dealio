"use client";

import { addActivity, toggleActivity } from "@/lib/api";
import type { Activity } from "@/lib/api";
import { useState } from "react";

interface ActivityFeedProps {
  leadId: number;
  activities: Activity[];
  onActivityAdded: (activity: Activity) => void;
  onActivityToggled: (activity: Activity) => void;
}

export default function ActivityFeed({
  leadId,
  activities,
  onActivityAdded,
  onActivityToggled,
}: ActivityFeedProps) {
  const [noteContent, setNoteContent] = useState("");
  const [taskContent, setTaskContent] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const notes = activities.filter((a) => a.type === "note");
  const tasks = activities.filter((a) => a.type === "task");

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) {
      setNoteError("Input content cannot be empty.");
      return;
    }
    if (isSubmittingNote) return;
    setNoteError(null);
    setIsSubmittingNote(true);
    try {
      const activity = await addActivity(leadId, { type: "note", content: noteContent.trim() });
      onActivityAdded(activity);
      setNoteContent("");
    } catch (err) {
      console.error("Failed to add note:", err);
      setNoteError("Failed to add note. Please try again.");
    } finally {
      setIsSubmittingNote(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskContent.trim()) {
      setTaskError("Input content cannot be empty.");
      return;
    }
    if (isSubmittingTask) return;
    setTaskError(null);
    setIsSubmittingTask(true);
    try {
      const activity = await addActivity(leadId, { type: "task", content: taskContent.trim() });
      onActivityAdded(activity);
      setTaskContent("");
    } catch (err) {
      console.error("Failed to add task:", err);
      setTaskError("Failed to add task. Please try again.");
    } finally {
      setIsSubmittingTask(false);
    }
  }

  async function handleToggle(activity: Activity) {
    if (togglingId !== null) return;
    setTogglingId(activity.id);
    try {
      const updated = await toggleActivity(activity.id);
      onActivityToggled(updated);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    } finally {
      setTogglingId(null);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimelineIcon = (content: string) => {
    const text = content.toLowerCase();
    if (text.includes("searchio")) return "🔍";
    if (text.includes("email")) return "✉️";
    if (text.includes("call")) return "📞";
    return "📝";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Activity Timeline (Left, takes 2/3 space) ── */}
      <div className="lg:col-span-2 card-white p-6 flex flex-col h-[520px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">Activity Timeline</h2>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{notes.length} updates</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 space-y-5 relative">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-10">No activities yet.</p>
          ) : (
            <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
          )}

          {notes.map((note) => {
            const isSearchio = note.content.toLowerCase().includes("searchio");
            return (
              <div key={note.id} className="relative flex gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center z-10 text-sm shadow-sm ${
                    isSearchio
                      ? "bg-purple-50 border-purple-200 text-purple-600"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {getTimelineIcon(note.content)}
                </div>
                <div className="flex-1 pb-2">
                  {isSearchio ? (
                    <div className="bg-gradient-to-r from-purple-50/70 to-indigo-50/40 border border-purple-100 rounded-xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                          <span>🔍</span> Searchio Intelligence
                        </span>
                        <span className="text-[11px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md font-medium">
                          System · Just now
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed mt-1">
                        {note.content.replace(/^🔍\s*Searchio Intelligence:?\s*/i, "")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">{note.content.split("\n")[0] || "Note added"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(note.created_at)}</p>
                      {note.content.includes("\n") && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {note.content.substring(note.content.indexOf("\n") + 1)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddNote} className="mt-4 pt-4 border-t border-gray-100">
          <div className="relative flex items-center">
            <input
              id="note-input"
              type="text"
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                if (noteError) setNoteError(null);
              }}
              placeholder="Add Note..."
              className={`w-full bg-white border rounded-lg pl-4 pr-24 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-sm ${
                noteError
                  ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
              }`}
            />
            <button
              id="submit-note-btn"
              type="submit"
              disabled={noteContent.trim().length === 0 || isSubmittingNote}
              className="absolute right-1.5 px-4 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-semibold rounded-md transition-colors disabled:cursor-not-allowed cursor-pointer"
            >
              Add note
            </button>
          </div>
          {noteError && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1 animate-fade-in">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{noteError}</span>
            </p>
          )}
        </form>
      </div>

      {/* ── Follow-up Tasks (Right, takes 1/3 space) ── */}
      <div className="card-white p-6 flex flex-col h-[520px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">Follow-up Tasks</h2>
          <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
            {tasks.filter((t) => !t.is_completed).length} open
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-10">No tasks yet.</p>
          ) : (
            tasks.map((task) => {
              const isAISuggested = task.content.toLowerCase().includes("searchio") || task.content.toLowerCase().includes("cfo");
              return (
                <div key={task.id} className="flex items-start gap-3 group">
                  <button
                    onClick={() => handleToggle(task)}
                    disabled={togglingId === task.id}
                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      task.is_completed
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-gray-300 group-hover:border-indigo-400"
                    }`}
                  >
                    {task.is_completed && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${task.is_completed ? "text-gray-400 line-through" : "text-gray-900 font-medium"}`}>
                      {task.content}
                      {isAISuggested && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          AI Suggested
                        </span>
                      )}
                    </p>
                    {!task.is_completed && (
                      <p className="text-xs text-gray-500 mt-1">Due soon</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleAddTask} className="mt-4 pt-4 border-t border-gray-100">
          <div className="relative flex items-center">
            <input
              id="task-input"
              type="text"
              value={taskContent}
              onChange={(e) => {
                setTaskContent(e.target.value);
                if (taskError) setTaskError(null);
              }}
              placeholder="Add Task..."
              className={`w-full bg-white border rounded-lg pl-3 pr-20 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-sm ${
                taskError
                  ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
              }`}
            />
            <button
              id="submit-task-btn"
              type="submit"
              disabled={taskContent.trim().length === 0 || isSubmittingTask}
              className="absolute right-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-semibold rounded-md transition-colors disabled:cursor-not-allowed cursor-pointer"
            >
              Add task
            </button>
          </div>
          {taskError && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1 animate-fade-in">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{taskError}</span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

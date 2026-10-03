"use client";

import { useMemo, useState } from "react";
import type { DiagnosisResult } from "@/lib/diagnostics";
import type { IssueReport } from "@/db/schema";
import { getNode } from "@/lib/workflow";
import { Card, SectionTitle, SeverityBadge, StatusBadge } from "./ui";

const FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "open", label: "Açık" },
  { value: "investigating", label: "İnceleniyor" },
  { value: "solved", label: "Çözüldü" },
] as const;

const NEXT_STATUS: Record<string, { value: string; label: string } | undefined> = {
  open: { value: "investigating", label: "İncelemeye al" },
  investigating: { value: "solved", label: "Çözüldü işaretle" },
  solved: { value: "open", label: "Yeniden aç" },
};

interface IssuesBoardProps {
  issues: IssueReport[];
  onChange: () => void;
}

export default function IssuesBoard({ issues, onChange }: IssuesBoardProps) {
  const [filter, setFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? issues : issues.filter((issue) => issue.status === filter)),
    [issues, filter],
  );

  async function changeStatus(issue: IssueReport) {
    const next = NEXT_STATUS[issue.status];
    if (!next) return;
    setBusyId(issue.id);
    try {
      await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.value }),
      });
      onChange();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(issue: IssueReport) {
    setBusyId(issue.id);
    try {
      await fetch(`/api/issues/${issue.id}`, { method: "DELETE" });
      onChange();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <SectionTitle
        eyebrow="Takip"
        title="Sorun kayıtları"
        hint="Asistanla tespit edilen ve kaydedilen sorunlar. Durum degistikce liste güncellenir."
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === item.value
                ? "border-brand bg-brand/20 text-white"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {item.label}
            <span className="ml-1.5 text-slate-500">
              {item.value === "all"
                ? issues.length
                : issues.filter((issue) => issue.status === item.value).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-slate-500">
          Kayitli sorun yok. Teşhis asistanından bir sorun kaydedin.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((issue) => {
            const node = getNode(issue.nodeId);
            const diagnosis = issue.diagnosis as DiagnosisResult | null;
            const top = diagnosis?.matches?.[0];
            return (
              <li
                key={issue.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 animate-rise"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base">{node?.icon ?? "•"}</span>
                      <h3 className="text-sm font-semibold text-white">
                        {issue.title}
                      </h3>
                      <StatusBadge status={issue.status} />
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {issue.nodeName} -{" "}
                      {new Date(issue.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {NEXT_STATUS[issue.status] ? (
                      <button
                        type="button"
                        disabled={busyId === issue.id}
                        onClick={() => changeStatus(issue)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-brand/60 hover:text-white disabled:opacity-50"
                      >
                        {NEXT_STATUS[issue.status]?.label}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyId === issue.id}
                      onClick={() => remove(issue)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:border-rose-500/60 hover:text-rose-300 disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {issue.errorText ? (
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-white/5 bg-slate-950/70 p-3 font-mono text-[11px] text-slate-400">
                    {issue.errorText}
                  </pre>
                ) : null}

                {top ? (
                  <p className="mt-3 text-sm text-slate-300">
                    <span className="font-semibold text-emerald-300">Öneri: </span>
                    {top.entry.title} - {top.entry.fixSteps[0]}
                  </p>
                ) : null}

                {issue.notes ? (
                  <p className="mt-2 text-xs text-slate-500">Not: {issue.notes}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

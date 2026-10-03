"use client";

import { useCallback, useMemo, useState } from "react";
import type { KnowledgeEntry, IssueReport } from "@/db/schema";
import { WORKFLOW_META, getNode } from "@/lib/workflow";
import AssistantPanel from "./AssistantPanel";
import FlowMap from "./FlowMap";
import IssuesBoard from "./IssuesBoard";
import KnowledgeView from "./KnowledgeView";
import NodePanel from "./NodePanel";
import { Card } from "./ui";

type TabKey = "flow" | "assistant" | "issues" | "knowledge";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "flow", label: "Akış haritasi", icon: "🗺️" },
  { key: "assistant", label: "Teşhis asistanı", icon: "🧪" },
  { key: "issues", label: "Sorun takibi", icon: "📋" },
  { key: "knowledge", label: "Bilgi bankasi", icon: "📚" },
];

interface DashboardProps {
  knowledge: KnowledgeEntry[];
  initialIssues: IssueReport[];
}

export default function Dashboard({ knowledge, initialIssues }: DashboardProps) {
  const [tab, setTab] = useState<TabKey>("flow");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    "youtube-upload",
  );
  const [assistantNodeId, setAssistantNodeId] = useState("youtube-upload");
  const [assistantNonce, setAssistantNonce] = useState(0);
  const [issues, setIssues] = useState<IssueReport[]>(initialIssues);

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;

  const refreshIssues = useCallback(async () => {
    const response = await fetch("/api/issues", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { issues: IssueReport[] };
      setIssues(payload.issues);
    }
  }, []);

  const issueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      if (issue.status !== "solved") {
        counts[issue.nodeId] = (counts[issue.nodeId] ?? 0) + 1;
      }
    }
    return counts;
  }, [issues]);

  const stats = useMemo(() => {
    const open = issues.filter((issue) => issue.status === "open").length;
    const investigating = issues.filter(
      (issue) => issue.status === "investigating",
    ).length;
    const solved = issues.filter((issue) => issue.status === "solved").length;
    const critical = issues.filter((issue) => issue.severity === "critical").length;
    return { open, investigating, solved, critical, total: issues.length };
  }, [issues]);

  function openAssistant(nodeId: string) {
    setAssistantNodeId(nodeId);
    setAssistantNonce((value) => value + 1);
    setTab("assistant");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-lg font-black text-white">
              n8
            </span>
            <div>
              <h1 className="text-base font-semibold text-white">
                Otomasyon Sorun Asistanı
              </h1>
              <p className="text-xs text-slate-400">{WORKFLOW_META.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
              ☁️ {WORKFLOW_META.instance}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
              ⚡ {WORKFLOW_META.executions}
            </span>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-200">
              ⏳ Deneme süresi: {WORKFLOW_META.trialDaysLeft} gun
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-400">
              {WORKFLOW_META.state}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Açık sorun" value={stats.open} tone="rose" />
          <StatCard label="İnceleniyor" value={stats.investigating} tone="amber" />
          <StatCard label="Çözüldü" value={stats.solved} tone="emerald" />
          <StatCard label="Kritik kayıt" value={stats.critical} tone="orange" />
          <StatCard label="Bilinen kalıp" value={knowledge.length} tone="sky" />
        </section>

        <nav className="mb-5 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                tab === item.key
                  ? "border-brand bg-brand/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.key === "issues" && stats.total > 0 ? (
                <span className="rounded-full bg-white/10 px-1.5 text-[11px]">
                  {stats.total}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {tab === "flow" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-white">
                Akış haritasi
              </h2>
              <FlowMap
                selectedId={selectedNodeId}
                onSelect={setSelectedNodeId}
                issueCounts={issueCounts}
              />
            </Card>
            <NodePanel
              node={selectedNode ?? null}
              entries={knowledge}
              onReport={openAssistant}
            />
          </div>
        ) : null}

        {tab === "assistant" ? (
          <AssistantPanel
            key={`${assistantNodeId}-${assistantNonce}`}
            initialNodeId={assistantNodeId}
            onIssueSaved={refreshIssues}
          />
        ) : null}

        {tab === "issues" ? (
          <IssuesBoard issues={issues} onChange={refreshIssues} />
        ) : null}

        {tab === "knowledge" ? (
          <KnowledgeView entries={knowledge} onDiagnoseNode={openAssistant} />
        ) : null}
      </main>

      <footer className="mx-auto max-w-[1400px] px-6 pb-10 text-xs text-slate-500">
        Bilgi bankasi yerel olarak tohumlanir ve PostgreSQL'de saklanır. Hata
        mesajlarini yapistirdiginizda kalıplar eslesir ve çözüm adımları onerilir.
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rose" | "amber" | "emerald" | "orange" | "sky";
}) {
  const tones: Record<string, string> = {
    rose: "text-rose-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    orange: "text-orange-300",
    sky: "text-sky-300",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

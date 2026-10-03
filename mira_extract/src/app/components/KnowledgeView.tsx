"use client";

import { useMemo, useState } from "react";
import type { KnowledgeEntry } from "@/db/schema";
import { searchEntries } from "@/lib/diagnostics";
import { WORKFLOW_NODES } from "@/lib/workflow";
import { Card, SectionTitle, SeverityBadge } from "./ui";

interface KnowledgeViewProps {
  entries: KnowledgeEntry[];
  onDiagnoseNode: (nodeId: string) => void;
}

export default function KnowledgeView({
  entries,
  onDiagnoseNode,
}: KnowledgeViewProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => searchEntries(entries, query), [entries, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, KnowledgeEntry[]>();
    for (const entry of filtered) {
      const list = map.get(entry.nodeId) ?? [];
      list.push(entry);
      map.set(entry.nodeId, list);
    }
    return map;
  }, [filtered]);

  return (
    <Card>
      <SectionTitle
        eyebrow="Bilgi bankasi"
        title={`${entries.length} bilinen hata kalıbı`}
        hint="Hata mesajlarindan çıkarılan kalıplar, nedenler ve çözüm adımları. Arama yaparak veya düğüme giderek filtreleyin."
      />

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ara: 429, quotaExceeded, undefined, ElevenLabs, render..."
        className="mb-5 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-brand"
      />

      <div className="space-y-5">
        {[...grouped.entries()].map(([nodeId, list]) => {
          const node = WORKFLOW_NODES.find((item) => item.id === nodeId);
          return (
            <section key={nodeId}>
              <header className="mb-2 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span>{node?.icon ?? "•"}</span>
                  {node?.name ?? list[0].nodeName}
                  <span className="text-xs font-normal text-slate-500">
                    ({list.length})
                  </span>
                </h3>
                {node ? (
                  <button
                    type="button"
                    onClick={() => onDiagnoseNode(node.id)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-brand/60 hover:text-white"
                  >
                    Teşhis et
                  </button>
                ) : null}
              </header>
              <ul className="grid gap-2 md:grid-cols-2">
                {list.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={entry.severity} />
                      <span className="text-[11px] tracking-wide text-slate-500 uppercase">
                        {entry.category}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold text-slate-100">
                      {entry.title}
                    </h4>
                    <p className="mt-1 line-clamp-3 text-xs text-slate-400">
                      {entry.cause}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.patterns.slice(0, 4).map((pattern) => (
                        <code
                          key={pattern}
                          className="rounded bg-slate-950/70 px-1.5 py-0.5 font-mono text-[10px] text-sky-300"
                        >
                          {pattern}
                        </code>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-slate-500">
            Eşleşen kayıt yok.
          </div>
        ) : null}
      </div>
    </Card>
  );
}

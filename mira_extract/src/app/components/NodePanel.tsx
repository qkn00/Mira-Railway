"use client";

import { useState } from "react";
import type { KnowledgeEntry } from "@/db/schema";
import {
  GROUP_LABELS,
  type WorkflowNode,
} from "@/lib/workflow";
import { Card, SectionTitle, SeverityBadge } from "./ui";

interface NodePanelProps {
  node: WorkflowNode | null;
  entries: KnowledgeEntry[];
  onReport: (nodeId: string) => void;
}

export default function NodePanel({ node, entries, onReport }: NodePanelProps) {
  const [checked, setChecked] = useState<string[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  if (!node) {
    return (
      <Card className="h-full">
        <SectionTitle
          eyebrow="Düğüm denetleyicisi"
          title="Bir düğüm secin"
          hint="Akış haritasindan bir düğüme tıklayın; kontrol listesi ve bilinen hatalar burada gorunur."
        />
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
          Henüz düğüm secilmedi.
        </div>
      </Card>
    );
  }

  const nodeEntries = entries.filter(
    (entry) => entry.nodeId === node.id || entry.nodeId === "any",
  );

  const toggle = (item: string) =>
    setChecked((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );

  return (
    <Card className="h-full animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl">
            {node.icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">{node.name}</h2>
            <p className="text-xs text-slate-400">
              {node.nodeType} - {GROUP_LABELS[node.group]}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <SeverityBadge
            severity={node.risk === "yüksek" ? "high" : node.risk === "orta" ? "medium" : "low"}
          />
          <span className="text-[10px] tracking-wide text-slate-500 uppercase">
            Kırılma riski
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-300">{node.role}</p>

      <div className="mt-5">
        <SectionTitle
          title="Hızlı kontrol listesi"
          hint="Sorun cikmadan önce / ilk bakista dogrulanmasi gerekenler."
        />
        <ul className="space-y-2">
          {node.checklist.map((item) => (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-300 hover:border-white/15">
                <input
                  type="checkbox"
                  checked={checked.includes(item)}
                  onChange={() => toggle(item)}
                  className="mt-0.5 h-4 w-4 accent-[#ea4b71]"
                />
                <span className={checked.includes(item) ? "text-slate-500 line-through" : ""}>
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <SectionTitle
          title="Bilinen hatalar ve çözümler"
          hint={`${nodeEntries.length} kayıt bilgi bankasinda.`}
        />
        <div className="space-y-2">
          {nodeEntries.map((entry) => {
            const isOpen = openId === entry.id;
            return (
              <article
                key={entry.id}
                className="rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : entry.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <span className="flex items-center gap-2">
                    <SeverityBadge severity={entry.severity} />
                    <span className="text-sm font-medium text-slate-100">
                      {entry.title}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">{isOpen ? "Kapat" : "Aç"}</span>
                </button>
                {isOpen ? (
                  <div className="space-y-3 border-t border-white/5 px-3 py-3 text-sm">
                    <p className="text-slate-400">{entry.cause}</p>
                    <div>
                      <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        Belirtiler
                      </p>
                      <ul className="list-disc space-y-0.5 pl-5 text-slate-300">
                        {entry.symptoms.map((symptom) => (
                          <li key={symptom}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                        Çözüm adımları
                      </p>
                      <ol className="list-decimal space-y-1 pl-5 text-slate-200">
                        {entry.fixSteps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    {entry.docsUrl ? (
                      <a
                        href={entry.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-xs font-semibold text-brand hover:underline"
                      >
                        Resmi dokümantasyon {"->"}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onReport(node.id)}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Bu düğümde sorun yaşıyorum
      </button>
    </Card>
  );
}

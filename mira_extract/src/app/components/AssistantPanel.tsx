"use client";

import { useState } from "react";
import type { DiagnosisResult } from "@/lib/diagnostics";
import {
  SYMPTOM_OPTIONS,
  WORKFLOW_NODES,
  getNode,
  getNodeName,
} from "@/lib/workflow";
import { Card, ConfidenceBar, SectionTitle, SeverityBadge } from "./ui";

const SAMPLE_ERRORS = [
  "ERROR: Request failed with status code 403 - quotaExceeded (YouTube)",
  "409 Conflict: terminated by other getUpdates",
  "TypeError: Cannot read properties of undefined (reading 'url')",
  "ETIMEDOUT / socket hang up while calling Creatomate render",
  "422 Unprocessable Entity - voice_id is invalid",
  "401 Unauthorized - invalid api key (ElevenLabs)",
  "Render durumu surekli 'rendering', çıktı URL'i boş",
];

interface AssistantPanelProps {
  initialNodeId: string;
  onIssueSaved: () => void;
}

export default function AssistantPanel({
  initialNodeId,
  onIssueSaved,
}: AssistantPanelProps) {
  const [nodeId, setNodeId] = useState(initialNodeId);
  const [symptom, setSymptom] = useState("çalışmıyor");
  const [errorText, setErrorText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const node = getNode(nodeId);

  async function runDiagnosis() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, errorText, symptom }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Teşhis başarısız oldu.");
      }
      const payload = (await response.json()) as DiagnosisResult;
      setResult(payload);
      if (!title) {
        setTitle(payload.matches[0]?.entry.title ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function saveIssue() {
    setError(null);
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          title: title || result?.matches[0]?.entry.title || "Adsiz sorun",
          errorText,
          symptom,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Kayıt başarısız.");
      }
      setSaved(true);
      onIssueSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <Card>
        <SectionTitle
          eyebrow="Teşhis asistanı"
          title="Sorunu anlat"
          hint="Düğümü seç, belirtiyi işaretle ve n8n logundaki hata mesajını yapıştır."
        />

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Düğüm
            </span>
            <select
              value={nodeId}
              onChange={(event) => setNodeId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand"
            >
              {WORKFLOW_NODES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.icon} {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Belirti
            </span>
            <select
              value={symptom}
              onChange={(event) => setSymptom(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand"
            >
              {SYMPTOM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Hata mesajı / gözlem
            </span>
            <textarea
              value={errorText}
              onChange={(event) => setErrorText(event.target.value)}
              rows={5}
              placeholder="Örnek: ERROR: Request failed with status code 403 - quotaExceeded"
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-brand"
            />
          </label>

          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_ERRORS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setErrorText(sample)}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand/60 hover:text-white"
              >
                {sample.length > 34 ? `${sample.slice(0, 34)}...` : sample}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={runDiagnosis}
            disabled={loading}
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Analiz ediliyor..." : "Teşhis et"}
          </button>

          {error ? (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          ) : null}

          {node ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">{node.name}</p>
              <p className="mt-1">{node.role}</p>
              <p className="mt-2 text-slate-500">
                İlk kontrol: {node.checklist[0]}
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="space-y-4">
        {result ? (
          <Card className="animate-rise">
            <SectionTitle
              eyebrow="Sonuç"
              title={`${result.nodeName} için teşhis`}
              hint={result.summary}
            />

            <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3">
              <p className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                Hemen dene
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-emerald-100">
                {result.quickWins.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {result.matches.map((match) => (
                <article
                  key={match.entry.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <SeverityBadge severity={match.entry.severity} />
                      <h3 className="text-sm font-semibold text-white">
                        {match.entry.title}
                      </h3>
                    </span>
                    <span className="w-32">
                      <ConfidenceBar value={match.confidence} />
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-400">{match.entry.cause}</p>

                  {match.reasons.length > 0 ? (
                    <ul className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                      {match.reasons.map((reason) => (
                        <li key={reason}>- {reason}</li>
                      ))}
                    </ul>
                  ) : null}

                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-200">
                    {match.entry.fixSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {match.entry.nodeName} - {match.entry.category}
                    </span>
                    {match.entry.docsUrl ? (
                      <a
                        href={match.entry.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Dokümantasyon {"->"}
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Sorunu takibe al
              </p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Kısa başlık (or. YouTube kotası aşıldı)"
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-brand"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveIssue}
                  className="rounded-xl border border-brand/60 bg-brand/15 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
                >
                  Kaydet
                </button>
                {saved ? (
                  <span className="text-xs font-semibold text-emerald-300">
                    Sorun takip listesine eklendi.
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    {getNodeName(nodeId)} düğümü için kayıt oluşur.
                  </span>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-full">
            <SectionTitle
              eyebrow="Nasıl çalışır"
              title="Ucte kural tabanlı teşhis motoru"
            />
            <ol className="space-y-3 text-sm text-slate-300">
              <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="font-semibold text-white">1. Hatayi yapıştır</span>
                <p className="mt-1 text-slate-400">
                  n8n executions panelinden hata mesajını kopyala. Kalıp eşleşmesi
                  (429, 401, quotaExceeded, ETIMEDOUT...) otomatik yapılır.
                </p>
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="font-semibold text-white">2. Düğüm ve belirtiyi seç</span>
                <p className="mt-1 text-slate-400">
                  Asistan önce seçilen düğüme özgü kayıtları, sonra tüm akışı
                  ilgilendiren genel kayıtları puanlar.
                </p>
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="font-semibold text-white">3. Çözüm adımlarını uygula</span>
                <p className="mt-1 text-slate-400">
                  Her öneri güven skoru, neden açıklaması ve uygulanabilir adımlar
                  icerir. Gerekiyorsa sorunu takip listesine kaydet.
                </p>
              </li>
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}

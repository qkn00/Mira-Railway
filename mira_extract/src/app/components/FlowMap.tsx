"use client";

import { useMemo, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GROUP_STYLES,
  NODE_HEIGHT,
  NODE_WIDTH,
  WORKFLOW_EDGES,
  WORKFLOW_NODES,
  edgePath,
  getNode,
} from "@/lib/workflow";

interface FlowMapProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  issueCounts?: Record<string, number>;
}

export default function FlowMap({
  selectedId,
  onSelect,
  issueCounts = {},
}: FlowMapProps) {
  const [zoom, setZoom] = useState(0.82);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const paths = useMemo(
    () =>
      WORKFLOW_EDGES.map((edge) => {
        const from = getNode(edge.from);
        const to = getNode(edge.to);
        if (!from || !to) return null;
        const active =
          selectedId === from.id ||
          selectedId === to.id ||
          hoveredId === from.id ||
          hoveredId === to.id;
        return { key: `${edge.from}->${edge.to}`, d: edgePath(from, to), active };
      }).filter((item): item is { key: string; d: string; active: boolean } =>
        Boolean(item),
      ),
    [selectedId, hoveredId],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <LegendDot className="border-sky-400/60 bg-sky-400/20" label="Tetikleyici" />
          <LegendDot className="border-violet-400/60 bg-violet-400/20" label="Veri" />
          <LegendDot className="border-amber-400/60 bg-amber-400/20" label="Mantik" />
          <LegendDot className="border-emerald-400/60 bg-emerald-400/20" label="Medya" />
          <LegendDot className="border-fuchsia-400/60 bg-fuchsia-400/20" label="Yapay zeka" />
          <LegendDot className="border-rose-400/60 bg-rose-400/20" label="Çıktı" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Zoom</span>
          <button
            type="button"
            aria-label="Uzaklastir"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
            className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10"
          >
            -
          </button>
          <span className="w-10 text-center text-xs text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Yakinlastir"
            onClick={() => setZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
            className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(0.82)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10"
          >
            Sigdir
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-white/10 bg-slate-950/60">
        <div
          className="grid-dots relative"
          style={{
            width: CANVAS_WIDTH * zoom,
            height: CANVAS_HEIGHT * zoom,
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${zoom})`,
            }}
          >
            <svg
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute top-0 left-0"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.75)" />
                </marker>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea4b71" />
                </marker>
              </defs>
              {paths.map((path) => (
                <path
                  key={path.key}
                  d={path.d}
                  fill="none"
                  stroke={path.active ? "#ea4b71" : "rgba(148,163,184,0.4)"}
                  strokeWidth={path.active ? 2.2 : 1.4}
                  markerEnd={path.active ? "url(#arrow-active)" : "url(#arrow)"}
                  className={path.active ? "edge-flow" : undefined}
                />
              ))}
            </svg>

            {WORKFLOW_NODES.map((node) => {
              const isSelected = selectedId === node.id;
              const openIssues = issueCounts[node.id] ?? 0;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onSelect(node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                  className={`absolute flex cursor-pointer flex-col justify-center rounded-xl border px-3 text-left transition ${
                    isSelected
                      ? "border-brand bg-brand/15 shadow-[0_0_0_1px_rgba(234,75,113,0.5),0_12px_30px_rgba(234,75,113,0.25)]"
                      : `${GROUP_STYLES[node.group]} hover:border-white/40 hover:bg-white/10`
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[12px] leading-tight font-semibold text-white">
                    <span aria-hidden="true">{node.icon}</span>
                    <span className="truncate">{node.name}</span>
                  </span>
                  <span className="mt-0.5 truncate text-[10px] text-slate-400">
                    {node.nodeType.replace("n8n-nodes-base.", "")}
                  </span>
                  {openIssues > 0 ? (
                    <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                      {openIssues}
                    </span>
                  ) : null}
                  {node.risk === "yüksek" && openIssues === 0 ? (
                    <span
                      className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-amber-400"
                      title="Yüksek kırılma riski"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        İpucu: Bir düğüme tıklayın; sağ panelde kontrol listesi, bilinen hatalar ve
        çözüm adımları açılır. Turuncu nokta yüksek kırılma riskini, kırmızı rozet
        açık sorun sayısını gösterir.
      </p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full border ${className}`} />
      {label}
    </span>
  );
}

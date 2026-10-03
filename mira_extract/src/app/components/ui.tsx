import type { ReactNode } from "react";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  medium: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  low: "bg-sky-500/15 text-sky-300 border-sky-500/40",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Kritik",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  investigating: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  solved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  investigating: "İnceleniyor",
  solved: "Çözüldü",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.medium}`}
    >
      {SEVERITY_LABELS[severity] ?? severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${STATUS_STYLES[status] ?? STATUS_STYLES.open}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const tone =
    value >= 75
      ? "from-emerald-400 to-emerald-500"
      : value >= 50
        ? "from-amber-300 to-amber-500"
        : "from-slate-500 to-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone}`}
          style={{ width: `${Math.max(6, Math.min(100, value))}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-slate-300">
        %{value}
      </span>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(2,6,23,0.45)] backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  hint,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
}) {
  return (
    <header className="mb-4">
      {eyebrow ? (
        <p className="text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-slate-400">{hint}</p> : null}
    </header>
  );
}

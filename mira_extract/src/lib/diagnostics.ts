import type { KnowledgeEntry } from "@/db/schema";
import { SYMPTOM_OPTIONS, getNodeName } from "@/lib/workflow";

export interface DiagnosisMatch {
  entry: KnowledgeEntry;
  confidence: number;
  matchedPatterns: string[];
  reasons: string[];
}

export interface DiagnosisResult {
  nodeId: string;
  nodeName: string;
  symptom: string;
  matches: DiagnosisMatch[];
  summary: string;
  quickWins: string[];
  generalMatches: DiagnosisMatch[];
}

interface DiagnoseInput {
  nodeId: string;
  errorText: string;
  symptom: string;
  entries: KnowledgeEntry[];
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

export function symptomCategories(symptom: string): string[] {
  const option = SYMPTOM_OPTIONS.find((item) => item.value === symptom);
  return option?.categories ?? [];
}

export function diagnose({
  nodeId,
  errorText,
  symptom,
  entries,
}: DiagnoseInput): DiagnosisResult {
  const haystack = (errorText ?? "").toLowerCase();
  const categories = symptomCategories(symptom);
  const nodeMatches: DiagnosisMatch[] = [];
  const generalMatches: DiagnosisMatch[] = [];

  for (const entry of entries) {
    const matchedPatterns: string[] = [];
    for (const pattern of entry.patterns) {
      const regex = safeRegex(pattern);
      if (regex && regex.test(haystack)) {
        matchedPatterns.push(pattern);
      }
    }

    const reasons: string[] = [];
    let score = 0;

    if (entry.nodeId === nodeId) {
      score += 5;
      reasons.push("Seçilen düğüme özgü bilinen hata");
    } else if (entry.nodeId === "any") {
      score += 1;
      reasons.push("Tüm akışı etkileyebilen genel sorun");
    } else {
      continue;
    }

    if (matchedPatterns.length > 0) {
      score += Math.min(6, matchedPatterns.length * 2.5);
      reasons.push(
        `Hata metniyla eşleşen kalıplar: ${matchedPatterns.join(", ")}`,
      );
    }

    if (categories.includes(entry.category)) {
      score += 3;
      reasons.push(`Belirti kategorisi (${entry.category}) ile uyumlu`);
    }

    score += SEVERITY_WEIGHT[entry.severity] ?? 1;

    const confidence = Math.max(
      12,
      Math.min(97, Math.round(28 + score * 6.5)),
    );

    const match: DiagnosisMatch = {
      entry,
      confidence,
      matchedPatterns,
      reasons,
    };

    if (entry.nodeId === nodeId) {
      nodeMatches.push(match);
    } else {
      generalMatches.push(match);
    }
  }

  const sortFn = (a: DiagnosisMatch, b: DiagnosisMatch) => {
    if (b.matchedPatterns.length !== a.matchedPatterns.length) {
      return b.matchedPatterns.length - a.matchedPatterns.length;
    }
    return b.confidence - a.confidence;
  };

  nodeMatches.sort(sortFn);
  generalMatches.sort(sortFn);

  const matches = [...nodeMatches.slice(0, 4), ...generalMatches.slice(0, 1)];
  const top = matches[0];

  const quickWins = top
    ? top.entry.fixSteps.slice(0, 3)
    : [
        "Düğümün giriş verisini 'Execute previous node' ile incele",
        "n8n loglarindaki tam hata mesajını kopyala",
        "Workflow'u tek adimda çalıştırarak hatayi daralt",
      ];

  const summary = top
    ? `En olası neden: ${top.entry.title} (${top.confidence}% güven). ${
        top.matchedPatterns.length > 0
          ? "Hata mesajindaki kalıplar bu çözümle eşleşiyor."
          : "Hata metni net degil; seçilen düğümün bilinen sorunlarina göre oneriliyor."
      }`
    : "Bu düğüm için bilinen bir hata kalıbı bulunamadi. Hatayi elle inceleyin.";

  return {
    nodeId,
    nodeName: getNodeName(nodeId),
    symptom,
    matches,
    summary,
    quickWins,
    generalMatches,
  };
}

/** Bilgi bankasi için basit metin arama. */
export function searchEntries(
  entries: KnowledgeEntry[],
  query: string,
): KnowledgeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) =>
    [
      entry.title,
      entry.nodeName,
      entry.category,
      entry.cause,
      ...entry.symptoms,
      ...entry.fixSteps,
      ...entry.patterns,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

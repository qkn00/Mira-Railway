import { db } from "@/db";
import { knowledgeEntries } from "@/db/schema";
import { KNOWLEDGE_SEED_NORMALIZED } from "@/lib/knowledge";
import { sql } from "drizzle-orm";

let seeded = false;

/**
 * Bilgi bankasi boş ise tohum verisini yazar. Idempotent'tir; uygulama her
 * acildiginda calisabilir.
 */
export async function ensureKnowledgeSeeded(): Promise<void> {
  if (seeded) return;

  const existing = await db
    .select({ id: knowledgeEntries.id })
    .from(knowledgeEntries)
    .limit(1);

  if (existing.length > 0) {
    seeded = true;
    return;
  }

  await db.insert(knowledgeEntries).values(
    KNOWLEDGE_SEED_NORMALIZED.map((entry) => ({
      nodeId: entry.nodeId,
      nodeName: entry.nodeName,
      category: entry.category,
      title: entry.title,
      patterns: entry.patterns,
      severity: entry.severity,
      cause: entry.cause,
      symptoms: entry.symptoms,
      fixSteps: entry.fixSteps,
      docsUrl: entry.docsUrl ?? null,
    })),
  );

  seeded = true;
}

/** Tablolarin var olduğundan emin olur (drizzle-kit push calistirilmamis ise). */
export async function ensureTables(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id SERIAL PRIMARY KEY,
      node_id TEXT NOT NULL,
      node_name TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      patterns JSONB NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      cause TEXT NOT NULL,
      symptoms JSONB NOT NULL,
      fix_steps JSONB NOT NULL,
      docs_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS issue_reports (
      id SERIAL PRIMARY KEY,
      node_id TEXT NOT NULL,
      node_name TEXT NOT NULL,
      title TEXT NOT NULL,
      error_text TEXT,
      symptom TEXT,
      severity TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      diagnosis JSONB,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

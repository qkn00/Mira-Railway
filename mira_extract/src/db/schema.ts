import {
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const severityEnum = pgEnum("severity", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const issueStatusEnum = pgEnum("issue_status", [
  "open",
  "investigating",
  "solved",
]);

/**
 * Bilgi bankasi: her satir, n8n akisindaki bir düğüm (ya da tüm akış) için
 * bilinen bir hata kaliibini, nedenini ve çözüm adımlarını tutar.
 */
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull(),
  nodeName: text("node_name").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  patterns: jsonb("patterns").$type<string[]>().notNull(),
  severity: severityEnum("severity").notNull().default("medium"),
  cause: text("cause").notNull(),
  symptoms: jsonb("symptoms").$type<string[]>().notNull(),
  fixSteps: jsonb("fix_steps").$type<string[]>().notNull(),
  docsUrl: text("docs_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type NewKnowledgeEntry = typeof knowledgeEntries.$inferInsert;

/** Kullanıcının asistanla birlikte kaydettigi sorun kayıtları. */
export const issueReports = pgTable("issue_reports", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull(),
  nodeName: text("node_name").notNull(),
  title: text("title").notNull(),
  errorText: text("error_text"),
  symptom: text("symptom"),
  severity: severityEnum("severity").notNull().default("medium"),
  status: issueStatusEnum("status").notNull().default("open"),
  diagnosis: jsonb("diagnosis").$type<unknown>(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type IssueReport = typeof issueReports.$inferSelect;
export type NewIssueReport = typeof issueReports.$inferInsert;

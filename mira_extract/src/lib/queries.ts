import { db } from "@/db";
import { issueReports, knowledgeEntries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureKnowledgeSeeded, ensureTables } from "@/lib/seed";
import type { DiagnosisResult } from "@/lib/diagnostics";
import type { IssueReport, NewIssueReport } from "@/db/schema";

type Severity = IssueReport["severity"];
type IssueStatus = IssueReport["status"];

export async function bootstrapData(): Promise<void> {
  await ensureTables();
  await ensureKnowledgeSeeded();
}

export async function getKnowledge() {
  await bootstrapData();
  return db.select().from(knowledgeEntries).orderBy(knowledgeEntries.id);
}

export async function getIssues() {
  await bootstrapData();
  return db.select().from(issueReports).orderBy(desc(issueReports.createdAt));
}

export interface CreateIssueInput {
  nodeId: string;
  nodeName: string;
  title: string;
  errorText?: string;
  symptom?: string;
  severity: Severity;
  diagnosis?: DiagnosisResult | null;
  notes?: string;
}

export async function createIssue(input: CreateIssueInput) {
  await bootstrapData();
  const values: NewIssueReport = {
    nodeId: input.nodeId,
    nodeName: input.nodeName,
    title: input.title,
    errorText: input.errorText ?? null,
    symptom: input.symptom ?? null,
    severity: input.severity,
    status: "open",
    diagnosis: (input.diagnosis ?? null) as unknown as Record<string, unknown> | null,
    notes: input.notes ?? null,
  };
  const [created] = await db.insert(issueReports).values(values).returning();
  return created;
}

export async function updateIssue(
  id: number,
  patch: { status?: IssueStatus; notes?: string; severity?: Severity },
) {
  await bootstrapData();
  const [updated] = await db
    .update(issueReports)
    .set({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.severity ? { severity: patch.severity } : {}),
      updatedAt: new Date(),
    })
    .where(eq(issueReports.id, id))
    .returning();
  return updated;
}

export async function deleteIssue(id: number) {
  await bootstrapData();
  const [deleted] = await db
    .delete(issueReports)
    .where(eq(issueReports.id, id))
    .returning();
  return deleted;
}

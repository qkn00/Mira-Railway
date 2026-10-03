import { NextResponse } from "next/server";
import { createIssue, getIssues } from "@/lib/queries";
import { diagnose } from "@/lib/diagnostics";
import { getKnowledge } from "@/lib/queries";
import { WORKFLOW_NODES, getNodeName } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET() {
  const issues = await getIssues();
  return NextResponse.json({ issues });
}

interface CreateIssueBody {
  nodeId?: string;
  title?: string;
  errorText?: string;
  symptom?: string;
  notes?: string;
}

export async function POST(request: Request) {
  let body: CreateIssueBody;
  try {
    body = (await request.json()) as CreateIssueBody;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek govdesi." },
      { status: 400 },
    );
  }

  const nodeId = body.nodeId ?? "";
  if (!WORKFLOW_NODES.some((node) => node.id === nodeId)) {
    return NextResponse.json(
      { error: "Bilinmeyen düğüm." },
      { status: 400 },
    );
  }

  const title = (body.title ?? "").trim();
  if (title.length < 3) {
    return NextResponse.json(
      { error: "Sorun basligi en az 3 karakter olmalı." },
      { status: 400 },
    );
  }

  const entries = await getKnowledge();
  const diagnosis = diagnose({
    nodeId,
    errorText: body.errorText ?? "",
    symptom: body.symptom ?? "diger",
    entries,
  });

  const severity =
    diagnosis.matches[0]?.entry.severity ??
    (WORKFLOW_NODES.find((node) => node.id === nodeId)?.risk === "yüksek"
      ? "high"
      : "medium");

  const issue = await createIssue({
    nodeId,
    nodeName: getNodeName(nodeId),
    title,
    errorText: body.errorText ?? "",
    symptom: body.symptom ?? "diger",
    severity,
    diagnosis,
    notes: body.notes ?? "",
  });

  return NextResponse.json({ issue, diagnosis }, { status: 201 });
}

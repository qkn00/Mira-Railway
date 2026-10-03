import { NextResponse } from "next/server";
import { diagnose } from "@/lib/diagnostics";
import { getKnowledge } from "@/lib/queries";
import { WORKFLOW_NODES } from "@/lib/workflow";

export const dynamic = "force-dynamic";

interface DiagnoseRequestBody {
  nodeId?: string;
  errorText?: string;
  symptom?: string;
}

export async function POST(request: Request) {
  let body: DiagnoseRequestBody;
  try {
    body = (await request.json()) as DiagnoseRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek govdesi." },
      { status: 400 },
    );
  }

  const nodeId = body.nodeId ?? "";
  const known = WORKFLOW_NODES.some((node) => node.id === nodeId);
  if (!known) {
    return NextResponse.json(
      { error: "Bilinmeyen düğüm." },
      { status: 400 },
    );
  }

  const entries = await getKnowledge();
  const result = diagnose({
    nodeId,
    errorText: body.errorText ?? "",
    symptom: body.symptom ?? "diger",
    entries,
  });

  return NextResponse.json(result);
}

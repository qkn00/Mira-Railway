import { NextResponse, type NextRequest } from "next/server";
import { deleteIssue, updateIssue } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = ["open", "investigating", "solved"] as const;
type AllowedStatus = (typeof ALLOWED_STATUS)[number];

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Geçersiz kayıt kimliği." }, { status: 400 });
  }

  let body: { status?: string; notes?: string; severity?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek govdesi." },
      { status: 400 },
    );
  }

  const patch: {
    status?: AllowedStatus;
    notes?: string;
    severity?: "critical" | "high" | "medium" | "low";
  } = {};

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.includes(body.status as AllowedStatus)) {
      return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    }
    patch.status = body.status as AllowedStatus;
  }

  if (body.severity !== undefined) {
    const allowed = ["critical", "high", "medium", "low"];
    if (!allowed.includes(body.severity)) {
      return NextResponse.json({ error: "Geçersiz onem derecesi." }, { status: 400 });
    }
    patch.severity = body.severity as "critical" | "high" | "medium" | "low";
  }

  if (typeof body.notes === "string") {
    patch.notes = body.notes;
  }

  const updated = await updateIssue(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Kayıt bulunamadi." }, { status: 404 });
  }

  return NextResponse.json({ issue: updated });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Geçersiz kayıt kimliği." }, { status: 400 });
  }

  const deleted = await deleteIssue(id);
  if (!deleted) {
    return NextResponse.json({ error: "Kayıt bulunamadi." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

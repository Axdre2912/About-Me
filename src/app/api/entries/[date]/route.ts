import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrCreateEntry, updateEntry } from "@/lib/entries";
import { z } from "zod";

const updateSchema = z.object({
  content: z.string().optional(),
  moodTags: z.array(z.string().max(32)).max(10).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const entry = await getOrCreateEntry(session.user.id, date);
  return NextResponse.json(entry);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await updateEntry(session.user.id, date, parsed.data);
  return NextResponse.json(entry);
}

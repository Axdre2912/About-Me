import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAudioForUser } from "@/lib/audio";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const audio = await getAudioForUser(id, session.user.id);
  if (!audio) {
    return new NextResponse(null, { status: 404 });
  }

  const total = audio.data.length;
  const baseHeaders = {
    "Content-Type": audio.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
  };

  // Range support so seeking works in <audio> players (required by Safari/iOS)
  const range = req.headers.get("range");
  const match = range?.match(/bytes=(\d*)-(\d*)/);
  if (match && (match[1] || match[2])) {
    const start = match[1] ? parseInt(match[1], 10) : total - parseInt(match[2], 10);
    const end = match[1] && match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;

    if (isNaN(start) || start < 0 || start > end || start >= total) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }

    const chunk = audio.data.subarray(start, end + 1);
    return new NextResponse(new Uint8Array(chunk), {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(chunk.length),
      },
    });
  }

  return new NextResponse(new Uint8Array(audio.data), {
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const audio = await prisma.audio.findFirst({
    where: { id, entry: { userId: session.user.id } },
    select: { id: true },
  });

  if (!audio) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.audio.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

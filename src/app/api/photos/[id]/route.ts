import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPhotoForUser } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { deletePhotoFile } from "@/lib/photos";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photo = await getPhotoForUser(id, session.user.id);
  if (!photo) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(photo.data, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
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
  const photo = await prisma.photo.findFirst({
    where: { id, entry: { userId: session.user.id } },
    include: { entry: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deletePhotoFile(session.user.id, photo.entryId, photo.filename);
  await prisma.photo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

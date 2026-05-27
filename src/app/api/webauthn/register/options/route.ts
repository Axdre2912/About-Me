import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRegistrationOptions } from "@/lib/webauthn";
import { setChallenge } from "@/lib/challenges";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const options = await getRegistrationOptions(user.id, user.email);
  setChallenge(user.id, options.challenge);

  return NextResponse.json(options);
}

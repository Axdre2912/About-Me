import { NextRequest, NextResponse } from "next/server";
import { getAuthenticationOptions } from "@/lib/webauthn";
import { setChallenge } from "@/lib/challenges";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
    include: { passkeys: true },
  });

  if (!user || user.passkeys.length === 0) {
    return NextResponse.json({ error: "No passkeys for this account" }, { status: 404 });
  }

  const options = await getAuthenticationOptions(user.id);
  setChallenge(user.id, options.challenge);

  return NextResponse.json({ options, userId: user.id });
}

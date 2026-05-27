import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyRegistration } from "@/lib/webauthn";
import { getChallenge } from "@/lib/challenges";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const challenge = getChallenge(session.user.id);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
  }

  const body = (await req.json()) as RegistrationResponseJSON;
  const result = await verifyRegistration(session.user.id, body, challenge);

  if (!result.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}

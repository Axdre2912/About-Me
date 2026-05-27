import { NextRequest, NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/webauthn";
import { getChallenge } from "@/lib/challenges";
import { issuePasskeyToken } from "@/lib/passkey-tokens";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

export async function POST(req: NextRequest) {
  const { response, userId } = await req.json();
  if (!response || !userId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const challenge = getChallenge(userId);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
  }

  const result = await verifyAuthentication(
    userId,
    response as AuthenticationResponseJSON,
    challenge
  );

  if (!result.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const passkeyToken = issuePasskeyToken(userId);
  return NextResponse.json({ passkeyToken });
}

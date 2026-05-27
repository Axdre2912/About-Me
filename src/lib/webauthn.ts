import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { prisma } from "./prisma";

const rpName = "Personal Diary";
const rpID =
  process.env.WEBAUTHN_RP_ID ||
  (process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : "localhost");
const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function getRegistrationOptions(userId: string, userName: string) {
  const existing = await prisma.passkey.findMany({ where: { userId } });

  return generateRegistrationOptions({
    rpName,
    rpID,
    userName,
    userID: Buffer.from(userId),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: c.transports?.split(",") as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
}

export async function verifyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  challenge: string
) {
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false as const };
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  await prisma.passkey.create({
    data: {
      userId,
      credentialId: Buffer.from(credential.id).toString("base64url"),
      publicKey: Buffer.from(credential.publicKey).toString("base64"),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: response.response.transports?.join(",") ?? null,
    },
  });

  return { verified: true as const };
}

export async function getAuthenticationOptions(userId: string) {
  const passkeys = await prisma.passkey.findMany({ where: { userId } });

  return generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports?.split(",") as AuthenticatorTransport[] | undefined,
    })),
    userVerification: "preferred",
  });
}

export async function verifyAuthentication(
  userId: string,
  response: AuthenticationResponseJSON,
  challenge: string
) {
  const credentialId = response.id;
  const passkey = await prisma.passkey.findFirst({
    where: { userId, credentialId },
  });
  if (!passkey) return { verified: false as const };

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, "base64"),
      counter: passkey.counter,
      transports: passkey.transports?.split(",") as AuthenticatorTransport[] | undefined,
    },
  });

  if (verification.verified) {
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });
  }

  return { verified: verification.verified };
}

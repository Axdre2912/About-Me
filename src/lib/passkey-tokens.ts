/** Short-lived tokens issued after successful WebAuthn verification */
const tokens = new Map<string, { userId: string; expires: number }>();

const TTL_MS = 60 * 1000;

export function issuePasskeyToken(userId: string): string {
  const token = crypto.randomUUID();
  tokens.set(token, { userId, expires: Date.now() + TTL_MS });
  return token;
}

export function consumePasskeyToken(token: string): string | null {
  const entry = tokens.get(token);
  tokens.delete(token);
  if (!entry || entry.expires < Date.now()) return null;
  return entry.userId;
}

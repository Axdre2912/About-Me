/** In-memory WebAuthn challenges (single-user app; use Redis in production) */
const challenges = new Map<string, { challenge: string; expires: number }>();

const TTL_MS = 5 * 60 * 1000;

export function setChallenge(userId: string, challenge: string) {
  challenges.set(userId, { challenge, expires: Date.now() + TTL_MS });
}

export function getChallenge(userId: string): string | null {
  const entry = challenges.get(userId);
  if (!entry || entry.expires < Date.now()) {
    challenges.delete(userId);
    return null;
  }
  challenges.delete(userId);
  return entry.challenge;
}

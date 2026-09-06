import { cookies } from "next/headers";

const COOKIE_PREFIX = "oauth_state_";
const MAX_AGE_SECONDS = 60 * 10;

interface StoredState {
  state: string;
  codeVerifier?: string;
}

export async function storeOAuthState(provider: string, state: string, codeVerifier?: string): Promise<void> {
  const store = await cookies();
  store.set(`${COOKIE_PREFIX}${provider}`, JSON.stringify({ state, codeVerifier } satisfies StoredState), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    priority: "high",
  });
}

/** Reads and clears the transient OAuth state cookie, returning it only if `state` matches (CSRF protection). */
export async function consumeOAuthState(provider: string, state: string): Promise<StoredState | null> {
  const store = await cookies();
  const name = `${COOKIE_PREFIX}${provider}`;
  const raw = store.get(name)?.value;
  store.delete(name);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredState;
    return parsed.state === state ? parsed : null;
  } catch {
    return null;
  }
}

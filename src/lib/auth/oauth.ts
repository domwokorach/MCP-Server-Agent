import { randomBytes, createHash } from "node:crypto";

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function generateState(): string {
  return base64url(randomBytes(32));
}

export function generateCodeVerifier(): string {
  return base64url(randomBytes(32));
}

export function codeChallengeFromVerifier(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export interface OAuthProfile {
  providerAccountId: string;
  email: string;
  fullName: string;
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Google (Authorization Code + PKCE) — https://developers.google.com/identity/protocols/oauth2
// ---------------------------------------------------------------------------

export function googleAuthorizationUrl(state: string, codeVerifier: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", `${appUrl()}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallengeFromVerifier(codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function resolveGoogleProfile(code: string, codeVerifier: string): Promise<OAuthProfile> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${appUrl()}/api/auth/google/callback`,
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!tokenResponse.ok) throw new Error("Google token exchange failed.");
  const tokens = (await tokenResponse.json()) as { access_token: string };

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userResponse.ok) throw new Error("Failed to fetch Google profile.");
  const profile = (await userResponse.json()) as { sub: string; email: string; name?: string };
  return { providerAccountId: profile.sub, email: profile.email, fullName: profile.name || profile.email };
}

// ---------------------------------------------------------------------------
// GitHub (Authorization Code) — https://docs.github.com/en/apps/oauth-apps
// ---------------------------------------------------------------------------

export function githubAuthorizationUrl(state: string): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", `${appUrl()}/api/auth/github/callback`);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function resolveGithubProfile(code: string): Promise<OAuthProfile> {
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      client_secret: process.env.GITHUB_CLIENT_SECRET || "",
      redirect_uri: `${appUrl()}/api/auth/github/callback`,
      code,
    }),
  });
  if (!tokenResponse.ok) throw new Error("GitHub token exchange failed.");
  const tokens = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokens.access_token) throw new Error(tokens.error || "GitHub token exchange failed.");

  const headers = { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/vnd.github+json" };
  const userResponse = await fetch("https://api.github.com/user", { headers });
  if (!userResponse.ok) throw new Error("Failed to fetch GitHub profile.");
  const profile = (await userResponse.json()) as { id: number; name?: string; login: string; email?: string };

  let email = profile.email;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", { headers });
    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      email = emails.find((entry) => entry.primary && entry.verified)?.email ?? emails[0]?.email;
    }
  }
  if (!email) throw new Error("GitHub account has no accessible email address.");

  return { providerAccountId: String(profile.id), email, fullName: profile.name || profile.login };
}

import { NextResponse } from "next/server";
import { generateState, githubAuthorizationUrl } from "@/lib/auth/oauth";
import { storeOAuthState } from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.json({ message: "GitHub sign-in is not configured." }, { status: 503 });
  }
  const state = generateState();
  await storeOAuthState("github", state);
  return NextResponse.redirect(githubAuthorizationUrl(state));
}

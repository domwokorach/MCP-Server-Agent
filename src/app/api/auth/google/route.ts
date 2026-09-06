import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier, googleAuthorizationUrl } from "@/lib/auth/oauth";
import { storeOAuthState } from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ message: "Google sign-in is not configured." }, { status: 503 });
  }
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  await storeOAuthState("google", state, codeVerifier);
  return NextResponse.redirect(googleAuthorizationUrl(state, codeVerifier));
}

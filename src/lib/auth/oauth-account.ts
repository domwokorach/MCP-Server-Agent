import type { OAuthProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OAuthProfile } from "@/lib/auth/oauth";

/** Finds the user linked to this OAuth identity, linking to an existing email match or creating a new account. */
export async function findOrCreateOAuthUser(provider: OAuthProvider, profile: OAuthProfile) {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
    include: { user: true },
  });
  if (existingAccount) return existingAccount.user;

  const normalizedEmail = profile.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: { userId: existingUser.id, provider, providerAccountId: profile.providerAccountId },
    });
    return existingUser;
  }

  return prisma.user.create({
    data: {
      fullName: profile.fullName,
      email: normalizedEmail,
      address: "",
      role: "user",
      oauthAccounts: { create: { provider, providerAccountId: profile.providerAccountId } },
    },
  });
}

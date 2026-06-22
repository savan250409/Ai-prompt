import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { store } from "@/server/store";

/**
 * Auth.js (NextAuth v5) — web-native accounts (§2). Email/password + Google.
 * Adapter-less JWT sessions so it works against BOTH the in-memory store (mock
 * mode) and Prisma; users are managed via the store. Server-side only.
 */
const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email",
    credentials: { email: {}, password: {} },
    async authorize(creds) {
      const email = typeof creds?.email === "string" ? creds.email : "";
      const password = typeof creds?.password === "string" ? creds.password : "";
      if (!email.includes("@") || password.length < 1) return null;

      const user = await store.users.findByEmail(email);
      if (!user || !user.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // we link by verified email in our store (adapter-less)
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/**
 * Resolve the JWT secret. A real secret is REQUIRED to serve in production —
 * we fail-fast rather than silently use a forgeable default. The dev fallback
 * keeps mock mode running with no env, and the production build (which never
 * serves auth) is exempted so `next build` works without secrets.
 */
function resolveAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (secret) return secret;
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !isBuildPhase) {
    throw new Error(
      "NEXTAUTH_SECRET (or AUTH_SECRET) must be set in production — refusing to start with an insecure default.",
    );
  }
  return "dev-insecure-secret-change-me";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    // For OAuth, ensure a store user exists and attach our id (adapter-less).
    async signIn({ user, account }) {
      if (account && account.provider !== "credentials" && user.email) {
        const u = await store.users.upsertOAuth({
          email: user.email,
          name: user.name,
          image: user.image,
        });
        user.id = u.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
});

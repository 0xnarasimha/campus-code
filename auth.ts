import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";
import { createOAuthUser } from "./lib/auth-helpers";
import {
  authConfig,
  googleClientId,
  googleClientSecret,
  isGoogleEnabled,
} from "./auth.config";

// Server-only auth: spreads the edge-safe authConfig (callbacks, JWT
// session, trustHost) and adds the Prisma adapter plus the full Credentials
// provider whose authorize() needs bcrypt + db. Never import this module
// from middleware.ts — import { auth } from "./auth.config" instead.
//
// Google OAuth (fail-soft): included only when GOOGLE_CLIENT_ID/SECRET are
// set. allowDangerousEmailAccountLinking links a verified Google email to an
// existing credentials account with the same email (same-email
// credentials↔Google accounts link) instead of raising OAuthAccountNotLinked.
//
// Custom createUser: the default Prisma adapter only writes {name, email,
// image, emailVerified}, but our User model requires handle, passwordHash,
// year, branch, avatarInitials (no DB defaults) — without this, every Google
// signup fails with PrismaClientValidationError → error=Configuration page.
// Handle is slugged from the Google profile name (email-prefix fallback),
// made unique by appending digits on conflict, and the insert retries on
// P2002 handle races (bounded) so a TOCTOU loser never surfaces a raw
// constraint error.
const baseAdapter = PrismaAdapter(db);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: {
    ...baseAdapter,
    createUser: async (data) => {
      if (!data.email) throw new Error("OAuth profile has no email");
      const user = await createOAuthUser(db, {
        name: data.name ?? "",
        email: data.email,
        emailVerified: data.emailVerified ?? null,
      });
      return {
        id: user.id,
        handle: user.handle,
        name: user.name,
        email: user.email,
        emailVerified: data.emailVerified ?? null,
        image: null,
      };
    },
  },
  providers: [
    ...(isGoogleEnabled
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        let user;
        try {
          user = await db.user.findUnique({ where: { email } });
        } catch {
          // DB down (DATABASE_URL unset, engine failed, connection
          // refused): fail closed as bad credentials — loginAction maps
          // this to generic "Invalid credentials", never a 500/stack.
          return null;
        }
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          handle: user.handle,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
});

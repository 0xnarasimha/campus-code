import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";
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
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
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
        const user = await db.user.findUnique({ where: { email } });
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

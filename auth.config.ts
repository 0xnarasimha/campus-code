import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Edge-safe auth configuration: NO adapter, NO database client, NO bcrypt
// imports. The middleware runs in the Edge runtime, where PrismaClient
// (Node APIs at module scope in lib/db.ts) would crash every request.
// Session reads in middleware only need AUTH_SECRET to verify the JWT, so
// this module exports its own `auth` wrapper built from the JWT-only config.
// The Credentials provider here intentionally has NO `authorize` callback:
// `authorize` needs bcrypt + db (server-only) and never runs in middleware.
// The full provider with `authorize` is defined in server-only `auth.ts`,
// which spreads `authConfig` below and only overrides `providers`.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      handle: string;
    } & DefaultSession["user"];
  }

  interface User {
    handle: string;
  }
}

export interface TokenExtras {
  id?: string;
  handle?: string;
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const t = token as typeof token & TokenExtras;
        t.id = user.id;
        t.handle = user.handle;
      }
      return token;
    },
    session: async ({ session, token }) => {
      const t = token as TokenExtras;
      if (session.user) {
        session.user.id = typeof t.id === "string" ? t.id : "";
        session.user.handle = typeof t.handle === "string" ? t.handle : "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

// Edge-safe session reader for middleware.ts. Same AUTH_SECRET + JWT
// strategy as auth.ts, so tokens issued by the server config verify here.
export const { auth } = NextAuth(authConfig);

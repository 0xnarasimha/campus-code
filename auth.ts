import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";

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

interface TokenExtras {
  id?: string;
  handle?: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
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
});

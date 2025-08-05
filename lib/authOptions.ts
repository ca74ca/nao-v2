// lib/authOptions.ts
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { NextAuthOptions } from "next-auth";
import { Session } from "next-auth";

// Extend Session type to include `provider`
declare module "next-auth" {
  interface Session {
    provider?: string;
  }
}

// ✅ Terminal Debug Logs
console.log("🔍 GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("🔍 GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID);
console.log("🔍 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("🔍 NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET);

// ✅ Shared Auth Config
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/get-started",
  },
  session: {
    strategy: "jwt",
  },
  debug: true,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.provider = typeof token.provider === "string" ? token.provider : undefined;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

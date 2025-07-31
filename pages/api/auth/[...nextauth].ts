import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { Session } from "next-auth";


// Extend the Session type to include 'provider'
declare module "next-auth" {
  interface Session {
    provider?: string;
  }
}

// 🔍 Debug environment variables to confirm they're loaded
console.log("🔍 GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("🔍 GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("🔍 GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID);
console.log("🔍 GITHUB_CLIENT_SECRET:", process.env.GITHUB_CLIENT_SECRET);
console.log("🔍 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("🔍 NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET);
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);


export default NextAuth({
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
    signIn: "/get-started", // custom sign-in route
  },
  session: {
    strategy: "jwt",
  },
  debug: true, // ✅ Enables terminal logging for OAuth and errors
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
  secret: process.env.NEXTAUTH_SECRET, // ✅ Required in production
});

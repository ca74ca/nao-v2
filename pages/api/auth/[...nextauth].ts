import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    // Add more providers as needed
  ],
  pages: {
    signIn: "/signin", // Custom sign-in page
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always redirect to /mint after login
      return "/mint";
    },
  },
  // You can add more callbacks, session/jwt config, etc. here as needed
});
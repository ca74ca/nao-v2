import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions"; // ✅ Shared config

export default NextAuth(authOptions);

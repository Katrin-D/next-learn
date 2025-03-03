import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { z } from "zod";
import type { User } from "@/app/lib/definitions";
import bcrypt from "bcrypt";
import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    const userRow = user.rows[0];
    return userRow;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          console.log("[auth.ts] - parsed success");
          const { email, password } = parsedCredentials.data;
          console.log(`[auth.ts] - parsed success ${email} ${password}`);
          const user = await getUser(email);
          if (!user) {
            console.log("HERE??");
            return null;
          }

          console.log(`[auth.ts] - users ${user.email} ${user.password}`);
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            console.log(`[auth.ts] - users matched`);
            return user;
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const org = await prisma.organisation.findUnique({
            where: { email: credentials.email },
          });

          if (!org) return null;

          const pwdMatch = await bcrypt.compare(credentials.password, org.passwordHash);
          if (!pwdMatch) return null;

          return {
            id: org.id,
            email: org.email,
            name: org.name,
            orgId: org.id,
          };
        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.orgId = user.orgId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.orgId = token.orgId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

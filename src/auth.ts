import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumePasskeyToken } from "@/lib/passkey-tokens";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        passkeyToken: { label: "Passkey Token", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email
          ? String(credentials.email).toLowerCase()
          : null;

        // Biometric / passkey login after WebAuthn verification
        if (credentials?.passkeyToken) {
          const userId = consumePasskeyToken(String(credentials.passkeyToken));
          if (!userId) return null;
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (!user) return null;
          if (email && user.email !== email) return null;
          return { id: user.id, email: user.email, name: user.name };
        }

        if (!email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(
          String(credentials.password),
          user.password
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

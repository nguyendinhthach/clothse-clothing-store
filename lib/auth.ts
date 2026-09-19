import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/services/users";
import { routes } from "@/lib/routes";

// Auth.js v5 — Credentials only (SPEC §11). Session is a signed JWT cookie;
// id + role ride inside it so pages and actions never re-query for them.
export const { handlers, auth, signIn, signOut, unstable_update: updateSession } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: routes.signIn },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const user = await verifyCredentials(String(creds.email ?? ""), String(creds.password ?? ""));
        if (!user) return null;
        return { id: String(user.id), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      // updateSession({ user: { name, email } }) after a profile edit — the JWT
      // is the only copy of name/email the header reads, so refresh it here.
      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string") token.name = session.user.name;
        if (typeof session.user.email === "string") token.email = session.user.email;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});

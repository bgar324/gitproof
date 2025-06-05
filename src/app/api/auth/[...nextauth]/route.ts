import NextAuth, { AuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import { JWT } from "next-auth/jwt";

// 1) Extend `JWT` and `Session` types to include the extra fields we want:
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    email?: string | null;
    html_url?: string | null;
    created_at?: string | null;
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      html_url?: string | null;
      created_at?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email public_repo",
        },
      },
    }),
  ],

  callbacks: {
    // 2) In `jwt`, only fetch GitHub’s `/user` (and `/user/emails` if needed) once,
    //    then stash everything we need into `token`.
    async jwt({ token, account }) {
      if (account) {
        // store the GitHub access token so we can do API calls
        token.accessToken = account.access_token;

        try {
          // Fetch basic user info
          const userRes = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              "Content-Type": "application/json",
            },
          });
          const userData = await userRes.json();

          // userData.email may be null if email is private
          if (userData.email) {
            token.email = userData.email;
          } else {
            // If the user’s primary email is private, fetch /user/emails
            const emailsRes = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
                "Content-Type": "application/json",
              },
            });
            const emailsJson = await emailsRes.json();
            if (Array.isArray(emailsJson)) {
              const primary = (emailsJson as Array<{ email: string; primary: boolean }>).find(
                (e) => e.primary
              );
              token.email = primary?.email ?? null;
            } else {
              token.email = null;
            }
          }

          token.html_url = userData.html_url;
          token.created_at = userData.created_at;
        } catch (err) {
          console.error("Error fetching GitHub user data in jwt callback:", err);
        }
      }
      return token;
    },

    // 3) In `session`, copy from `token` into `session.user` with proper null handling
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }

      // Only update fields if they exist in the token
      if (token.email !== undefined) {
        session.user.email = token.email;
      }
      if (token.html_url !== undefined) {
        session.user.html_url = token.html_url;
      }
      if (token.created_at !== undefined) {
        session.user.created_at = token.created_at;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

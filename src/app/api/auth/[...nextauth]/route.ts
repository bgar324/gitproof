import NextAuth, { AuthOptions } from "next-auth"
import GitHub from "next-auth/providers/github"

export const authOptions: AuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: { 
          scope: "read:user user:email public_repo"
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      if (session.user) {
        // Get user data including email and profile URL
        const userResponse = await fetch('https://api.github.com/user', {
          headers: { 
            Authorization: `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        const userData = await userResponse.json()
        
        // If email is not public, fetch it from the emails endpoint
        if (!userData.email) {
          const emailsResponse = await fetch('https://api.github.com/user/emails', {
            headers: { 
              Authorization: `Bearer ${token.accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          const emails = await emailsResponse.json()
          const primaryEmail = emails.find((email: any) => email.primary)?.email
          if (primaryEmail) {
            session.user.email = primaryEmail
          }
        } else {
          session.user.email = userData.email
        }
        
        // Add GitHub profile URL to the user session
        if (userData.html_url) {
          session.user.html_url = userData.html_url
        }
        
        session.user.created_at = userData.created_at
      }
      return session
    },
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

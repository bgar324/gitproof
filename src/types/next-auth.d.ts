import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      /** The user's GitHub username */
      name?: string | null
      /** The user's email address */
      email?: string | null
      /** The user's GitHub profile image URL */
      image?: string | null
      /** The user's GitHub profile URL */
      html_url?: string
      /** When the user's account was created */
      created_at?: string
    } & DefaultSession["user"]
    /** The user's GitHub access token */
    accessToken?: string
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    /** The user's GitHub profile URL */
    html_url?: string
    /** When the user's account was created */
    created_at?: string
  }
}

declare module "next-auth/jwt" {
  /** Extend the built-in JWT types */
  interface JWT {
    /** The user's GitHub access token */
    accessToken?: string
  }
}

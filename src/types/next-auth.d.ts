import "next-auth"

declare module "next-auth" {
  interface User {
    createdAt?: string
  }
  interface Session {
    accessToken?: string
    user?: User & {
      createdAt?: string
    }
  }

  interface JWT {
    accessToken?: string
  }
}

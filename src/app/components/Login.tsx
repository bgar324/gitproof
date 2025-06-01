"use client"
import { signIn, signOut, useSession } from "next-auth/react"

export default function Login() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img 
            src={session.user?.image || ''} 
            alt={session.user?.name || ''} 
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium">{session.user?.name}</span>
        </div>
        <button 
          onClick={() => signOut()}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button 
      data-login-button
      onClick={() => signIn("github", { callbackUrl: '/dashboard' })}
      className="hidden"
    >
      Sign in with GitHub
    </button>
  )
}

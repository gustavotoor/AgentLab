import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      onboardingDone: boolean
      apiKeyValid: boolean
      locale: string
      theme: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    onboardingDone?: boolean
    apiKeyValid?: boolean
    locale?: string
    theme?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    onboardingDone: boolean
    apiKeyValid: boolean
    locale: string
    theme: string
  }
}

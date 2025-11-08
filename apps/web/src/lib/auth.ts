import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@synapse/database'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
    signIn: async ({ user, account }) => {
      if (account?.provider === 'google' && user?.email) {
        try {
          // Check if user exists
          const existingUser = await db('users').where('email', user.email).first()

          if (!existingUser) {
            // Create new user
            await db('users').insert({
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              created_at: new Date(),
              updated_at: new Date(),
            })
          }
          return true
        } catch (error) {
          console.error('Error creating user:', error)
          return false
        }
      }
      return true
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}
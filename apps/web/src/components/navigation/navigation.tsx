'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@synapse/ui'
import { Brain, Search, FolderOpen, Settings, User } from 'lucide-react'

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Synapse</span>
          </Link>

          {/* Navigation Links */}
          {session && (
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2 text-sm font-medium hover:text-primary">
                <Search className="h-4 w-4" />
                <span>Memory</span>
              </Link>
              <Link href="/collections" className="flex items-center space-x-2 text-sm font-medium hover:text-primary">
                <FolderOpen className="h-4 w-4" />
                <span>Collections</span>
              </Link>
              <Link href="/settings" className="flex items-center space-x-2 text-sm font-medium hover:text-primary">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : session ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ''}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium">{session.user?.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signin">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
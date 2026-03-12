'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth0 } from '@auth0/auth0-react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

const navItems = [
  { href: '/dashboard', label: 'Todos' },
  { href: '/recurring', label: 'Recurring' },
]

const STYLE_THEME_CLASS = {
  catppuccin: null,
  cyberpunk: 'theme-cyberpunk',
  'retro-arcade': 'theme-retro-arcade',
}

export default function AppShell({ children }) {
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [styleTheme, setStyleTheme] = useState(() => {
    if (typeof window === 'undefined') return 'catppuccin'
    return window.localStorage.getItem('styleTheme') || 'catppuccin'
  })
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } =
    useAuth0()

  useEffect(() => {
    window.localStorage.setItem('styleTheme', styleTheme)
    document.documentElement.classList.remove(
      'theme-cyberpunk',
      'theme-retro-arcade',
    )
    const nextClass = STYLE_THEME_CLASS[styleTheme]
    if (nextClass) {
      document.documentElement.classList.add(nextClass)
    }
  }, [styleTheme])

  const handleStyleThemeChange = (nextTheme) => {
    setStyleTheme(nextTheme)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading account...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">
            Daily Next
          </p>
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            Sign in to continue
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            This app now uses Auth0 user identity for your dashboard and
            recurring data.
          </p>
          <button
            type="button"
            onClick={() => loginWithRedirect()}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Log in with Auth0
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-3 px-4 py-3 md:grid-cols-3 md:px-6">
          <div className="justify-self-start">
            <div className="flex items-center gap-2">
              <Image
                src="/dayman-original.png"
                alt="Dayman icon"
                width={40}
                height={60}
                className="h-auto w-10"
              />
              <p className="text-lg font-bold uppercase tracking-wide text-primary md:text-xl">
                DAYMAN
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-4 justify-self-center">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border-b-2 px-1 py-1.5 text-sm font-semibold transition ${
                    active
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-2">
            <select
              value={styleTheme}
              onChange={(event) => handleStyleThemeChange(event.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground outline-none focus:border-ring"
              aria-label="Select style theme"
              title="Style theme"
            >
              <option value="catppuccin">Catppuccin</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="retro-arcade">Retro Arcade</option>
            </select>
            <button
              type="button"
              onClick={() =>
                setTheme((resolvedTheme || theme) === 'dark' ? 'light' : 'dark')
              }
              className="border-b-2 border-transparent px-1 py-1.5 text-sm font-semibold text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {(resolvedTheme || theme) === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <p className="max-w-[240px] truncate text-xs text-muted-foreground">
              {user?.email || user?.sub}
            </p>
            <button
              onClick={() =>
                logout({
                  logoutParams: { returnTo: window.location.origin },
                })
              }
              className="border-b-2 border-transparent px-1 py-1.5 text-sm font-semibold text-muted-foreground transition hover:border-border hover:text-foreground"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}

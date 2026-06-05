import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Background } from '@/components/Background'
import { Brand } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useLogout, useMe, type User } from '@/features/auth/api'
import { appLayoutStyles } from '@/features/layout/styles'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

// AppLayout is the shared shell for everything under /app — it enforces auth,
// renders the header, and the matching child route renders into <Outlet/>.
function AppLayout() {
  const me = useMe()
  const navigate = useNavigate()

  useEffect(() => {
    if (!me.isLoading && me.data === null) {
      navigate({ to: '/auth', replace: true })
    }
  }, [me.isLoading, me.data, navigate])

  if (me.isLoading) {
    return <LoadingScreen />
  }
  if (!me.data) {
    return null
  }

  return (
    <div className="app-root">
      <style>{appLayoutStyles}</style>
      <Background />
      <AppHeader user={me.data} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

function AppHeader({ user }: { user: User }) {
  const logout = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => navigate({ to: '/auth', replace: true }),
    })
  }

  return (
    <header className="app-header">
      <Brand to="/app" />
      <div className="app-header-right">
        <ThemeToggle />
        <span className="user-chip">
          <span className="user-dot" />
          <span className="user-name">{user.username}</span>
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Background />
      <span
        style={{
          position: 'relative',
          color: 'var(--text-3)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
        }}
      >
        loading session…
      </span>
    </div>
  )
}

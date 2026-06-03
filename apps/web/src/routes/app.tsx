import { createFileRoute, Link } from '@tanstack/react-router'
import { Background } from '@/components/Background'
import { Brand } from '@/components/Logo'

export const Route = createFileRoute('/app')({
  component: AppShellPlaceholder,
})

function AppShellPlaceholder() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Background />
      <header
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <Brand to="/" />
        <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 13 }}>
          Main app — coming up next
        </span>
      </header>
      <main
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1
            className="display"
            style={{ fontSize: 36, margin: '0 0 12px', letterSpacing: '-0.03em' }}
          >
            The request builder lives here.
          </h1>
          <p style={{ color: 'var(--text-2)', margin: '0 0 24px' }}>
            We've shipped the landing page and the auth flow. Next pass: the full
            request/response interface from <code className="mono">app.html</code>.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to="/" className="btn">Back to landing</Link>
            <Link to="/auth" className="btn btn-primary">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  )
}

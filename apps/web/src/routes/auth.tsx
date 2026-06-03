import { createFileRoute, useNavigate, useSearch, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Background } from '@/components/Background'
import { Brand } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useLogin, useSignup } from '@/features/auth/api'
import { ApiError } from '@/lib/api/client'

type Mode = 'login' | 'signup'

type AuthSearch = {
  mode?: Mode
}

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search.mode === 'signup' ? 'signup' : 'login',
  }),
  component: AuthPage,
})

function AuthPage() {
  const search = useSearch({ from: '/auth' })
  const navigate = useNavigate()
  const initialMode: Mode = search.mode === 'signup' ? 'signup' : 'login'
  const [mode, setModeState] = useState<Mode>(initialMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pendingProvider, setPendingProvider] = useState<'google' | 'github' | null>(null)
  const signup = useSignup()
  const login = useLogin()
  const submitting = signup.isPending || login.isPending

  function setMode(next: Mode) {
    setModeState(next)
    navigate({
      to: '/auth',
      search: next === 'signup' ? { mode: 'signup' } : {},
      replace: true,
    })
  }

  const pwScore = useMemo(() => scorePassword(password), [password])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    const onSuccess = () => {
      window.location.href = '/app'
    }
    const onError = (err: unknown) => {
      setErrorMsg(err instanceof ApiError ? err.message : 'Something went wrong')
    }

    if (isSignup) {
      signup.mutate({ username, email, password }, { onSuccess, onError })
    } else {
      login.mutate({ email, password }, { onSuccess, onError })
    }
  }

  function handleOAuth(provider: 'google' | 'github') {
    setPendingProvider(provider)
    setTimeout(() => {
      window.location.href = '/app'
    }, 900)
  }

  const isSignup = mode === 'signup'

  return (
    <div className="auth-root">
      <style>{authStyles}</style>
      <Background />

      <div className="auth-shell">
        {/* LEFT: brand side */}
        <aside className="auth-aside">
          <Brand to="/" />
          <div className="aside-content">
            <span className="aside-eyebrow">Welcome back</span>
            <h1 className="aside-title">
              Your requests,<br />
              <span className="em">wherever you are.</span>
            </h1>
            <p className="aside-sub">
              Sign in to access your collections, environments, and team workspaces.
              Anything you've saved syncs across every browser you open.
            </p>
            <div className="aside-quote">
              <div className="com">{'// what waits on the other side'}</div>
              <div><span className="ok">→</span> 247 saved requests</div>
              <div><span className="ok">→</span> 4 environments</div>
              <div><span className="ok">→</span> 12 teammates</div>
              <div><span className="ok">→</span> 0 conflicts <span className="com">{'// finally'}</span></div>
            </div>
          </div>
          <div className="aside-foot">
            <span>SOC 2 Type II</span>
            <span>·</span>
            <span>End-to-end encrypted</span>
            <span>·</span>
            <span>v2.4.1</span>
          </div>
        </aside>

        {/* RIGHT: form */}
        <section className="auth-form">
          <div className="top-bar">
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <ThemeToggle />
              <Link to="/" className="btn btn-ghost btn-sm">← Back to home</Link>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-tabs">
              <div className={`tab-pill ${isSignup ? 'signup' : ''}`} />
              <button
                type="button"
                className={`auth-tab ${!isSignup ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`auth-tab ${isSignup ? 'active' : ''}`}
                onClick={() => setMode('signup')}
              >
                Create account
              </button>
            </div>

            <h2 className="form-title">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="form-sub">
              {isSignup
                ? 'Free forever. Upgrade when your team grows.'
                : 'Pick up where you left off.'}
            </p>

            <div className="social">
              <button
                type="button"
                className="social-btn"
                disabled={pendingProvider !== null}
                onClick={() => handleOAuth('google')}
              >
                {pendingProvider === 'google' ? (
                  <>
                    <Spinner /> Redirecting to Google…
                  </>
                ) : (
                  <>
                    <GoogleIcon /> Continue with Google
                  </>
                )}
              </button>
              <button
                type="button"
                className="social-btn"
                disabled={pendingProvider !== null}
                onClick={() => handleOAuth('github')}
              >
                {pendingProvider === 'github' ? (
                  <>
                    <Spinner /> Redirecting to GitHub…
                  </>
                ) : (
                  <>
                    <GithubIcon /> Continue with GitHub
                  </>
                )}
              </button>
            </div>

            <div className="divider">or with email</div>

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <div className="field">
                  <label>Username</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="ada_lovelace"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              )}
              <div className="field">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label>
                  Password{' '}
                  {isSignup && <span className="opt">at least 8 characters</span>}
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  minLength={isSignup ? 8 : 6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {isSignup && (
                  <div className="pw-strength">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          background:
                            i < pwScore ? STRENGTH_COLORS[Math.min(pwScore - 1, 3)] : 'var(--hairline)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {isSignup ? (
                <div className="form-foot">
                  <label className="checkbox">
                    <input type="checkbox" required /> I agree to the <a href="#">Terms</a>
                  </label>
                </div>
              ) : (
                <div className="form-foot">
                  <label className="checkbox">
                    <input type="checkbox" /> Remember me
                  </label>
                  <a href="#">Forgot password?</a>
                </div>
              )}

              {errorMsg && (
                <div
                  style={{
                    color: 'var(--err)',
                    fontSize: 13,
                    marginBottom: 12,
                    padding: '8px 10px',
                    background: 'var(--err-soft, rgba(220, 38, 38, 0.08))',
                    border: '1px solid var(--err)',
                    borderRadius: 8,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? isSignup ? 'Creating…' : 'Signing in…'
                    : isSignup ? 'Create account' : 'Sign in'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>

              <p className="legal">
                {isSignup
                  ? 'Your free plan includes unlimited personal requests.'
                  : (
                    <>
                      By signing in, you agree to our <a href="#">Terms</a> and{' '}
                      <a href="#">Privacy Policy</a>.
                    </>
                  )}
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

const STRENGTH_COLORS = ['var(--err)', 'var(--warn)', 'var(--m-get)', 'var(--ok)']

function scorePassword(v: string): number {
  let score = 0
  if (v.length >= 8) score++
  if (/[A-Z]/.test(v)) score++
  if (/[0-9]/.test(v)) score++
  if (/[^A-Za-z0-9]/.test(v)) score++
  return score
}

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        border: '2px solid var(--accent-ring)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.01-.02-1.98-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.35.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

const authStyles = `
  .auth-root { min-height: 100vh; display: flex; flex-direction: column; }
  .auth-shell {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: relative;
    z-index: 2;
    min-height: 100vh;
  }
  .auth-aside {
    padding: 36px 48px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--hairline);
    position: relative;
    overflow: hidden;
  }
  .auth-aside::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(60% 60% at 30% 30%, var(--accent-soft) 0%, transparent 60%);
    pointer-events: none;
  }
  .auth-form {
    padding: 36px 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .aside-content { margin: auto 0; position: relative; z-index: 2; max-width: 460px; }
  .aside-eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin-bottom: 18px;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .aside-eyebrow::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 4px var(--accent-soft);
  }
  h1.aside-title {
    font-family: var(--font-sans);
    font-size: 44px;
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1.05;
    margin: 0 0 18px;
  }
  h1.aside-title .em {
    font-style: italic; font-weight: 500;
    background: linear-gradient(95deg, var(--accent), #4db6ff 75%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .aside-sub { color: var(--text-2); font-size: 15px; line-height: 1.55; margin: 0 0 28px; }

  .aside-quote {
    margin-top: 32px;
    padding: 18px 20px;
    background: var(--glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    font-family: var(--font-mono);
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.6;
  }
  .aside-quote .ok  { color: var(--ok); }
  .aside-quote .com { color: var(--text-3); }

  .aside-foot {
    color: var(--text-3); font-size: 12.5px;
    display: flex; align-items: center; gap: 14px;
    margin-top: auto; padding-top: 24px;
    position: relative; z-index: 2;
  }

  /* form column */
  .auth-card { width: 100%; max-width: 400px; }
  .auth-tabs {
    display: flex;
    background: var(--chip);
    padding: 4px;
    border-radius: 12px;
    margin-bottom: 28px;
    border: 1px solid var(--hairline);
    position: relative;
  }
  .auth-tab {
    flex: 1;
    text-align: center;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text-2);
    cursor: pointer;
    border: none;
    background: transparent;
    transition: color 0.2s;
    position: relative;
    z-index: 1;
  }
  .auth-tab.active { color: var(--text); }
  .tab-pill {
    position: absolute;
    top: 4px; bottom: 4px;
    width: calc(50% - 4px);
    background: var(--glass-strong);
    border: 1px solid var(--hairline);
    border-radius: 8px;
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s cubic-bezier(.2, .7, .2, 1);
    z-index: 0;
  }
  .tab-pill.signup { transform: translateX(100%); }

  h2.form-title {
    font-family: var(--font-sans);
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.03em;
    margin: 0 0 6px;
  }
  .form-sub { color: var(--text-2); font-size: 14px; margin: 0 0 24px; }

  .social { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
  .social-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 11px 14px;
    border: 1px solid var(--hairline-strong);
    border-radius: 10px;
    background: var(--glass);
    backdrop-filter: blur(20px);
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s, transform .1s;
    width: 100%;
  }
  .social-btn:hover { background: var(--chip-hover); }
  .social-btn:active { transform: translateY(1px); }
  .social-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .divider {
    display: flex; align-items: center; gap: 12px;
    color: var(--text-3); font-size: 11.5px;
    text-transform: uppercase; letter-spacing: 0.1em;
    margin: 4px 0 18px;
  }
  .divider::before, .divider::after {
    content: ""; flex: 1; height: 1px; background: var(--hairline);
  }

  .field { margin-bottom: 12px; }
  .field label {
    display: block; font-size: 12px;
    color: var(--text-2);
    margin-bottom: 6px;
    font-weight: 500;
  }
  .field label .opt { color: var(--text-3); font-weight: 400; }
  .pw-strength {
    height: 4px; border-radius: 2px;
    background: var(--chip);
    margin-top: 6px;
    overflow: hidden;
    display: flex; gap: 2px;
  }
  .pw-strength > div {
    flex: 1; background: var(--hairline);
    border-radius: 2px;
    transition: background 0.2s;
  }

  .form-foot {
    display: flex; align-items: center; justify-content: space-between;
    margin: 8px 0 22px;
    font-size: 13px;
  }
  .checkbox {
    display: flex; align-items: center; gap: 8px;
    color: var(--text-2);
    cursor: pointer;
    white-space: nowrap;
  }
  .checkbox input { accent-color: var(--accent); }
  .auth-card a { color: var(--accent); text-decoration: none; }
  .auth-card a:hover { text-decoration: underline; }
  .form-foot a { white-space: nowrap; }

  .submit {
    width: 100%;
    padding: 12px;
    font-size: 14px;
    font-weight: 600;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    box-shadow: 0 8px 24px -8px var(--accent-ring);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .submit:hover { background: var(--accent-2); }
  .submit:active { transform: translateY(1px); }
  .submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .legal {
    text-align: center;
    color: var(--text-3);
    font-size: 12px;
    margin-top: 16px;
    line-height: 1.5;
  }

  .top-bar {
    padding: 28px 36px;
    display: flex; align-items: center; justify-content: space-between;
    position: absolute; top: 0; left: 0; right: 0;
    z-index: 10;
  }
  .auth-form .top-bar { padding: 28px 48px; }

  /* aside brand is positioned via flow; ensure it stays above the gradient */
  .auth-aside .brand { position: relative; z-index: 2; }

  @media (max-width: 900px) {
    .auth-shell { grid-template-columns: 1fr; }
    .auth-aside { display: none; }
    .auth-form { padding: 80px 24px 24px; }
  }
`

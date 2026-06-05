import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  useCreateWorkspace,
  useWorkspaces,
  type Workspace,
} from '@/features/workspaces/api'
import { ApiError } from '@/lib/api/client'

export const Route = createFileRoute('/app/')({
  component: WorkspaceListPage,
})

function WorkspaceListPage() {
  const workspaces = useWorkspaces()

  if (workspaces.isLoading) {
    return <Centered>Loading workspaces…</Centered>
  }
  if (workspaces.isError) {
    return (
      <Centered>
        <span style={{ color: 'var(--err)' }}>
          {workspaces.error instanceof Error
            ? workspaces.error.message
            : 'Failed to load workspaces'}
        </span>
      </Centered>
    )
  }

  const list = workspaces.data ?? []
  if (list.length === 0) {
    return <EmptyWorkspaces />
  }
  return <WorkspaceGrid workspaces={list} />
}

function EmptyWorkspaces() {
  const [name, setName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const create = useCreateWorkspace()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    const trimmed = name.trim()
    if (!trimmed) return
    create.mutate(trimmed, {
      onSuccess: () => setName(''),
      onError: (err) => {
        setErrorMsg(err instanceof ApiError ? err.message : 'Something went wrong')
      },
    })
  }

  return (
    <div className="empty-shell">
      <div className="empty-card">
        <span className="eyebrow">welcome</span>
        <h1 className="empty-title">
          Let's create your first<br />
          <span className="em">workspace.</span>
        </h1>
        <p className="empty-sub">
          A workspace holds your collections, environments, and request history.
          Name it after a project, a team, or just call it Personal.
        </p>

        <form onSubmit={handleSubmit} className="empty-form">
          <input
            className="input"
            type="text"
            placeholder="My API workspace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={80}
          />
          <button
            type="submit"
            className="submit"
            disabled={!name.trim() || create.isPending}
          >
            <span>{create.isPending ? 'Creating…' : 'Create workspace'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        {errorMsg && <div className="empty-error">{errorMsg}</div>}
      </div>
    </div>
  )
}

function WorkspaceGrid({ workspaces }: { workspaces: Workspace[] }) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const create = useCreateWorkspace()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    const trimmed = name.trim()
    if (!trimmed) return
    create.mutate(trimmed, {
      onSuccess: () => {
        setName('')
        setCreating(false)
      },
      onError: (err) => {
        setErrorMsg(err instanceof ApiError ? err.message : 'Something went wrong')
      },
    })
  }

  return (
    <div className="ws-shell">
      <div className="ws-bar">
        <div>
          <h1 className="ws-title">Workspaces</h1>
          <p className="ws-sub">{workspaces.length} total</p>
        </div>
        {!creating && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCreating(true)}
          >
            + New workspace
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleSubmit} className="ws-create">
          <input
            className="input"
            type="text"
            placeholder="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={80}
          />
          <div className="ws-create-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || create.isPending}
            >
              {create.isPending ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setCreating(false)
                setName('')
                setErrorMsg(null)
              }}
            >
              Cancel
            </button>
          </div>
          {errorMsg && (
            <div className="empty-error" style={{ marginTop: 12 }}>
              {errorMsg}
            </div>
          )}
        </form>
      )}

      <div className="ws-grid">
        {workspaces.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
      </div>
    </div>
  )
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link
      to="/app/workspaces/$id"
      params={{ id: workspace.id }}
      className="ws-card"
    >
      <div className="ws-card-head">
        <span className="ws-card-name">{workspace.name}</span>
        <span className="ws-card-mono">{workspace.id.slice(0, 8)}</span>
      </div>
      <div className="ws-card-meta">
        <span className="ws-card-date">
          Created {formatRelative(workspace.created_at)}
        </span>
      </div>
      <div className="ws-card-foot">
        <span className="ws-card-hint">{'// collections, environments, requests'}</span>
      </div>
    </Link>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ color: 'var(--text-2)', fontSize: 14 }}>{children}</div>
    </div>
  )
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}

import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { useWorkspace } from '@/features/workspaces/api'
import {
  useCollections,
  useCreateCollection,
  type Collection,
} from '@/features/collections/api'
import { ApiError } from '@/lib/api/client'

export const Route = createFileRoute('/app/workspaces/$id')({
  component: WorkspaceDetailPage,
})

function WorkspaceDetailPage() {
  const { id } = useParams({ from: '/app/workspaces/$id' })
  const workspace = useWorkspace(id)
  const collections = useCollections(id)
  const [selectedID, setSelectedID] = useState<string | null>(null)

  if (workspace.isLoading) {
    return <Centered>Loading workspace…</Centered>
  }
  if (workspace.isError) {
    const status = workspace.error instanceof ApiError ? workspace.error.status : 0
    return (
      <Centered>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--err)', fontSize: 14, marginBottom: 12 }}>
            {status === 404
              ? "Workspace not found, or you don't have access."
              : 'Failed to load workspace.'}
          </div>
          <Link to="/app" className="btn btn-ghost btn-sm">← Back to workspaces</Link>
        </div>
      </Centered>
    )
  }
  if (!workspace.data) return null

  const list = collections.data ?? []
  const selected = list.find((c) => c.id === selectedID) ?? null

  return (
    <div className="wsd-shell">
      <Sidebar
        workspaceID={id}
        workspaceName={workspace.data.name}
        collections={list}
        loading={collections.isLoading}
        selectedID={selectedID}
        onSelect={setSelectedID}
      />
      <MainPane workspaceName={workspace.data.name} selected={selected} />
    </div>
  )
}

function Sidebar({
  workspaceID,
  workspaceName,
  collections,
  loading,
  selectedID,
  onSelect,
}: {
  workspaceID: string
  workspaceName: string
  collections: Collection[]
  loading: boolean
  selectedID: string | null
  onSelect: (id: string) => void
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const create = useCreateCollection(workspaceID)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    const trimmed = name.trim()
    if (!trimmed) return
    create.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setName('')
          setCreating(false)
        },
        onError: (err) => {
          setErrorMsg(err instanceof ApiError ? err.message : 'Something went wrong')
        },
      },
    )
  }

  return (
    <aside className="wsd-sidebar">
      <div className="wsd-side-head">
        <Link to="/app" className="wsd-back">← Workspaces</Link>
        <h2 className="wsd-side-title">{workspaceName}</h2>
        <p className="wsd-side-sub">{collections.length} collection{collections.length === 1 ? '' : 's'}</p>
      </div>

      <h3 className="wsd-side-section-title">
        <span>Collections</span>
        {!creating && (
          <button
            type="button"
            className="wsd-side-add"
            onClick={() => setCreating(true)}
            aria-label="New collection"
          >
            + new
          </button>
        )}
      </h3>

      {loading ? (
        <div className="wsd-coll-empty">loading…</div>
      ) : collections.length === 0 && !creating ? (
        <div className="wsd-coll-empty">
          No collections yet.<br />
          Use <strong>+ new</strong> to add one.
        </div>
      ) : (
        <ul className="wsd-coll-list">
          {collections.map((col) => (
            <li
              key={col.id}
              className={`wsd-coll-item ${selectedID === col.id ? 'active' : ''}`}
              onClick={() => onSelect(col.id)}
            >
              <FolderIcon className="wsd-coll-icon" />
              <span>{col.name}</span>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <form onSubmit={handleSubmit} className="wsd-coll-create">
          <input
            className="input"
            type="text"
            placeholder="Collection name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={80}
          />
          <div className="wsd-coll-create-actions">
            <button
              type="submit"
              className="ok"
              disabled={!name.trim() || create.isPending}
            >
              {create.isPending ? '…' : 'Add'}
            </button>
            <button
              type="button"
              className="cancel"
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
            <div className="empty-error" style={{ marginTop: 10, fontSize: 12 }}>
              {errorMsg}
            </div>
          )}
        </form>
      )}
    </aside>
  )
}

function MainPane({
  workspaceName,
  selected,
}: {
  workspaceName: string
  selected: Collection | null
}) {
  if (!selected) {
    return (
      <section className="wsd-main">
        <p className="wsd-main-eyebrow">{workspaceName}</p>
        <h1 className="wsd-main-title">Pick a collection</h1>
        <p className="wsd-main-sub">
          Collections are folders for grouping related requests. Create one in the
          sidebar to get started — or select an existing collection to see what's
          inside.
        </p>
        <div className="wsd-main-empty">
          {'// nothing selected'}
        </div>
      </section>
    )
  }

  return (
    <section className="wsd-main">
      <p className="wsd-main-eyebrow">{workspaceName} · {selected.id.slice(0, 8)}</p>
      <h1 className="wsd-main-title">{selected.name}</h1>
      <p className="wsd-main-sub">
        Requests inside this collection will live here. The request builder is next
        on the roadmap.
      </p>
      <div className="wsd-main-empty">
        {'// requests will live here'}
      </div>
    </section>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
      <div style={{ color: 'var(--text-2)', fontSize: 14 }}>{children}</div>
    </div>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  )
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  }

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'include', // send cookies (sessions will need this)
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  let body: unknown
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    body = await res.json().catch(() => undefined)
  } else {
    body = await res.text().catch(() => undefined)
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${res.status}`
    throw new ApiError(res.status, message, body)
  }

  return body as T
}

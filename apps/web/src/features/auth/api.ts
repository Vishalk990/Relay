import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetch } from '@/lib/api/client'

export type User = {
  id: string
  username: string
  email: string
  created_at: string
}

export type SignupRequest = {
  username: string
  email: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type AuthResponse = {
  user: User
}

export function useSignup() {
  return useMutation({
    mutationFn: (req: SignupRequest) =>
      apiFetch<AuthResponse>('/auth/sign-up', {
        method: 'POST',
        body: req,
      }),
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: (req: LoginRequest) =>
      apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: req,
      }),
  })
}

// useMe queries the current user via the cookie. Returns null on 401
// (so the FE can distinguish "not logged in" from "real error").
export function useMe() {
  return useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ user: User }>('/auth/me')
        return res.user
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null
        }
        throw err
      }
    },
    retry: false,
    staleTime: 60_000,
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Drop everything that depended on the auth'd identity.
      qc.clear()
    },
  })
}

import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'

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

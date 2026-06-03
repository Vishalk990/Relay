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

export type SignupResponse = {
  user: User
}

export function useSignup() {
  return useMutation({
    mutationFn: (req: SignupRequest) =>
      apiFetch<SignupResponse>('/auth/signup', {
        method: 'POST',
        body: req,
      }),
  })
}

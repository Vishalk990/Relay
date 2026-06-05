import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'

export type Workspace = {
  id: string
  owner_id: string
  name: string
  created_at: string
}

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await apiFetch<{ workspaces: Workspace[] }>('/workspaces')
      return res.workspaces ?? []
    },
  })
}

export function useWorkspace(workspaceID: string) {
  return useQuery<Workspace>({
    queryKey: ['workspaces', workspaceID],
    queryFn: async () => {
      const res = await apiFetch<{ workspace: Workspace }>(`/workspaces/${workspaceID}`)
      return res.workspace
    },
    enabled: !!workspaceID,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<{ workspace: Workspace }>('/workspaces', {
        method: 'POST',
        body: { name },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

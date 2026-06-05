import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'

export type Collection = {
  id: string
  workspace_id: string
  parent_id: string | null
  name: string
  position: number
  created_at: string
  updated_at: string
}

export function useCollections(workspaceID: string) {
  return useQuery<Collection[]>({
    queryKey: ['workspaces', workspaceID, 'collections'],
    queryFn: async () => {
      const res = await apiFetch<{ collections: Collection[] }>(
        `/workspaces/${workspaceID}/collections`,
      )
      return res.collections ?? []
    },
    enabled: !!workspaceID,
  })
}

export function useCreateCollection(workspaceID: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; parent_id?: string | null }) =>
      apiFetch<{ collection: Collection }>(`/workspaces/${workspaceID}/collections`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces', workspaceID, 'collections'] })
    },
  })
}

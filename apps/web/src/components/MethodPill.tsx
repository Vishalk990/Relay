import { cn } from '@/lib/utils'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export function MethodPill({
  method,
  className,
}: {
  method: HttpMethod
  className?: string
}) {
  return <span className={cn('method', `method-${method}`, className)}>{method}</span>
}

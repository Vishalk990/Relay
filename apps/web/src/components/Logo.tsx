import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return <span className={cn('logo', className)} aria-hidden />
}

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <a
      href={to}
      className="flex items-center gap-2.5 font-semibold tracking-tight text-[15px] no-underline"
      style={{ color: 'var(--text)' }}
    >
      <Logo /> Relay
    </a>
  )
}

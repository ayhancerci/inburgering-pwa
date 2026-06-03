import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-2xl bg-white shadow-sm ring-1 ring-slate-200', className)}>
      {children}
    </div>
  )
}

type ButtonVariant = 'primary' | 'subtle' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-yellow-400 text-slate-900 hover:bg-yellow-300 active:bg-yellow-500',
  subtle: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  )
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

type Tone = 'slate' | 'green' | 'yellow' | 'blue'

const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-sky-100 text-sky-700',
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone])}>
      {children}
    </span>
  )
}

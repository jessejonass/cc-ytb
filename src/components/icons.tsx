type P = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const ChevronLeft = ({ className = 'h-6 w-6' }: P) => (
  <svg {...base} className={className}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const ChevronRight = ({ className = 'h-6 w-6' }: P) => (
  <svg {...base} className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const Play = ({ className = 'h-5 w-5' }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z" />
  </svg>
)

export const Info = ({ className = 'h-5 w-5' }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
)

export const Search = ({ className = 'h-4 w-4' }: P) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const Star = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="m12 2.8 2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9Z" />
  </svg>
)

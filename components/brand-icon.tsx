import type { SVGProps } from 'react'

type BrandIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
  color?: string
  bgColor?: string
}

export function BrandIcon({ size = 24, color = 'currentColor', bgColor, ...props }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      {bgColor && <rect width="64" height="64" rx="15" fill={bgColor} />}
      <g stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="12" y="12" width="40" height="40" rx="8" />
        <path d="M12 29h23V12M35 29v23" />
        <path d="M21 39h5M42 21h3M42 40h3" />
      </g>
    </svg>
  )
}

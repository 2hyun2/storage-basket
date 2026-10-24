import Link from 'next/link'
import { ChevronRight, House } from 'lucide-react'

type BreadcrumbItem = {
  id: string
  name: string
}

type SpaceBreadcrumbProps = {
  items: BreadcrumbItem[]
}

export function SpaceBreadcrumb({ items }: SpaceBreadcrumbProps) {
  return (
    <nav aria-label="수납 지도 경로" className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1
        const href = item.id === 'home' ? '/app/space' : `/app/space/${item.id}`

        return (
          <div key={item.id} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={15} className="text-slate-300" />}
            {isCurrent ? (
              <span className="font-bold text-slate-900">{item.name}</span>
            ) : (
              <Link href={href} className="flex items-center gap-1 font-semibold text-violet-700 hover:underline">
                {index === 0 && <House size={15} />}
                {item.name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

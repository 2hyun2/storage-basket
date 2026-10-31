'use client'

import type { PlacementStep } from '@/lib/space/placement-workflow'

export function PlacementStepNavigation({ step, onSize, onPosition }: {
  step: PlacementStep
  onSize: () => void
  onPosition: () => void
}) {
  return (
    <div className="mt-3">
      <nav aria-label="3D 편집 단계" className="grid grid-cols-2 gap-2">
        {([
          ['size', '1. 크기 정하기', onSize],
          ['position', '2. 배치하기', onPosition],
        ] as const).map(([value, label, onClick]) => (
          <button key={value} type="button" onClick={onClick} aria-current={step === value ? 'step' : undefined}
            className={`rounded-lg border px-2 py-2 text-sm font-semibold ${step === value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        {step === 'size'
          ? '가로·세로·자체 높이를 정하세요. 실제 위치와 바닥에서의 높이는 다음 단계에서 정합니다.'
          : '크기는 고정되어 있습니다. 놓을 위치를 정한 뒤 저장하세요. 크기를 바꾸려면 1단계로 돌아가세요.'}
      </p>
    </div>
  )
}

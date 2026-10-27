import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { CreateRegistrationForm } from '@/components/space/create-registration-form'

export default function CreateSpacePage() {
  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-2xl">
        <Link href="/app/space" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          수납 지도로 돌아가기
        </Link>

        <div className="mt-6 rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600">
            <Plus size={17} />
            새 항목 등록
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">무엇을 추가할까요?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            공간의 계층과 물건의 보관 정보를 분리해 등록합니다.
          </p>

          <div className="mt-8">
            <CreateRegistrationForm />
          </div>
        </div>
      </section>
    </main>
  )
}

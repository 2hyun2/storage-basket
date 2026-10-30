import Link from 'next/link'
import { ArrowLeft, Box } from 'lucide-react'
import { CreateRegistrationForm } from '@/components/space/create-registration-form'

export default function CreateSpacePage() {
  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-2xl">
        <Link href="/app/register" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          등록으로 돌아가기
        </Link>

        <div className="mt-4 rounded-xl border border-violet-100 bg-white p-3 shadow-sm sm:p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600">
            <Box size={17} />
            공간 등록
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">공간 만들기</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            공간 이름과 들어갈 곳을 정합니다. 실제 3D 위치와 크기는 등록 뒤에 배치합니다.
          </p>

          <div className="mt-8">
            <CreateRegistrationForm />
          </div>
        </div>
      </section>
    </main>
  )
}

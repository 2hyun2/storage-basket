import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { BrandIcon } from '@/components/brand-icon'
import { AppFooter } from '@/components/app-footer'

export const metadata: Metadata = {
  title: '사용 가이드 | 우리집 공간록',
  description: '공동체 참여부터 공간 설계, 물건 검색과 복원까지. 우리집 공간록 사용 방법을 알아보세요.',
}

const chapters = [
  {
    id: 'start', title: '가입하고 함께 사용할 집 정하기', short: '가입·로그인 후 공동체를 만들거나 초대 코드로 참여하세요.', href: '/app/community', link: '공동체 관리',
    steps: [
      ['계정 만들기', '회원가입 후 로그인합니다. 공용 기기에서는 로그인 상태 유지 선택에 주의하고, 사용 후 로그아웃하세요. 이메일 기억과 로그인 상태 유지는 각각 선택할 수 있습니다.'],
      ['공동체 참여하기', '공동체 화면에서 초대 코드를 입력하고, 표시되는 공동체 이름과 대표를 확인한 뒤 참여합니다. 초대 링크를 받은 경우에는 링크의 안내를 따라 진행하세요.'],
      ['사용할 공동체 선택', '공동체가 여러 개라면 현재 사용할 공동체로 전환합니다. 공간과 물건은 선택한 공동체에 속하고 구성원이 함께 관리합니다.'],
      ['대표의 구성원 관리', '대표는 초대 코드를 재발급하거나 일반 구성원을 강퇴할 수 있습니다. 코드 재발급 후에도 기존 구성원 소속은 유지됩니다. 강퇴는 계정 삭제가 아니며 기존 공간·물건·변경 기록을 유지합니다. 강퇴 이력은 따로 남기지 않습니다. 이전 코드를 알고 있다면 다시 참여할 수 있으므로 필요한 경우 초대 코드도 재발급하세요.'],
    ],
    tip: '공동체는 함께 사용하는 집의 기록입니다. 초대 코드는 함께 관리할 사람에게 공유하세요.',
  },
  {
    id: 'spaces', title: '집 크기와 공간 등록', short: '집 크기를 정하고 방 → 수납장 → 서랍 순서로 공간을 만드세요.', href: '/app/space', link: '공간 탐색',
    steps: [
      ['집 전체 크기 정하기', '공간 탐색 화면에서 집의 가로·세로·높이를 cm로 입력합니다. 이 크기가 가장 바깥 경계가 되며, 이후 수정할 수도 있습니다.'],
      ['공간 만들기', '등록 → 공간 등록에서 이름, 공간을 넣을 곳, 색상을 정합니다. 거실은 집에, 수납장은 거실에, 서랍은 수납장에 넣는 식으로 차례대로 만듭니다. 공간 이름을 누르면 보관 위치가 선택되고 화살표는 목록을 펼칩니다.'],
      ['텍스트와 3D 함께 사용하기', '이름으로 먼저 등록한 공간은 미배치 상태입니다. 텍스트 트리에서 찾거나 미배치 공간의 3D 그리기를 눌러 위치와 크기를 나중에 정할 수 있습니다.'],
    ],
    tip: '공간은 물건을 담는 곳입니다. 물건 자체에는 좌표가 없으며, 만들어 둔 공간을 보관 위치로 선택합니다.',
  },
  {
    id: 'layout', title: '3D 위치·크기·높이 정하기', short: '격자로 위치를 잡고 숫자로 보정하세요. 모든 단위는 cm입니다.', href: '/app/space', link: '배치도 열기',
    steps: [
      ['격자에서 바닥 영역 선택', '3D 그리기 또는 3D 수정에서 2D 격자를 드래그해 위치와 영역을 정합니다. 드래그는 10cm 단위이고 숫자는 1cm 단위로 조정할 수 있습니다.'],
      ['X와 Y 구분하기', '좌표 X는 왼쪽에서 떨어진 거리, 좌표 Y는 위쪽에서 떨어진 거리입니다. 가로 X·세로 Y는 시작점부터 차지하는 크기입니다. 현재 들어갈 공간이 좌표의 기준입니다.'],
      ['두 높이 입력하기', '바닥에서의 높이는 공간이 시작하는 높이입니다. 바닥에 놓으면 0cm입니다. 공간 자체의 높이는 아래부터 위까지의 크기입니다. 두 값의 합이 담고 있는 공간 높이를 넘을 수 없습니다.'],
      ['미리보기와 저장', '회전 가능한 3D 미리보기로 띄운 위치와 크기를 확인합니다. 주변 공간·벽·창문도 함께 보입니다. 겹치거나 경계를 넘으면 저장할 수 없으며, 입력한 값은 저장을 눌러야 반영됩니다.'],
      ['선호하는 시점 기억하기', '공간 탐색 3D에서 회전·확대한 뒤 현재 시점 저장을 누릅니다. 같은 계정·브라우저에서 다른 공간을 열 때에도 공간 크기에 맞춘 각도와 확대 비율로 시작합니다. 저장한 시점으로 복귀는 저장값을 다시 적용하고, 기본 시점 초기화는 저장값을 지운 뒤 처음 시점으로 돌아갑니다. 기기 간 동기화와 생성·수정 미리보기에는 적용되지 않습니다.'],
    ],
    tip: '집과 바로 아래 방은 평면 중심으로 표시합니다. 내부 수납공간은 높이를 가진 입체로 보입니다. 배치 편집 미리보기에서는 높이도 확인할 수 있습니다.',
  },
  {
    id: 'structures', title: '벽·창문으로 공간 꾸미기', short: '벽과 창문은 공간 안에 따로 배치하는 구조물입니다.', href: '/app/space', link: '공간에서 구조물 선택',
    steps: [
      ['현재 공간에서 추가하기', '공간 상세의 벽·창문 메뉴에서 종류를 고르고 이름과 색상을 정합니다. 벽은 사용자가 필요한 곳에 직접 만듭니다.'],
      ['위치와 높이 조정', '공간 배치와 동일하게 격자·수치 입력·3D 미리보기를 사용합니다. 바닥에서의 높이와 공간 자체의 높이를 각각 지정하고 주변 공간과 겹치지 않는지 확인합니다.'],
      ['수정과 삭제', '기존 벽·창문을 선택해 크기와 위치를 수정하거나 삭제합니다. 이름표 표시 여부도 선택할 수 있습니다. 문이 필요한 곳은 벽을 채우지 않고 통로로 남겨 둡니다.'],
    ],
    tip: '벽·창문에는 내부 공간이나 물건을 넣지 않습니다. 물건을 보관할 곳은 공간으로 따로 등록하세요.',
  },
  {
    id: 'items', title: '물건 등록·검색·이동', short: '이름과 보관 공간을 기록하고, 검색 결과에서 위치를 확인하세요.', href: '/app/items', link: '물건 목록',
    steps: [
      ['물건 등록', '등록 → 물건 등록에서 이름과 보관 공간을 선택합니다. 수량은 숫자, 단위는 개·장·벌 같은 표현이며 카테고리는 직접 입력합니다. 필요한 경우 메모도 남깁니다.'],
      ['물건 찾기', '홈이나 물건 목록에서 검색어와 카테고리로 찾습니다. 거실 → 수납장 → 서랍처럼 표시되는 경로로 보관 위치를 확인하고, 위치를 눌러 해당 공간으로 이동합니다.'],
      ['상세와 위치 변경', '물건 상세에서 정보와 최근 기록을 확인합니다. 수정 화면에서 보관 공간을 바꾸고 저장하면 물건을 옮긴 것으로 기록됩니다.'],
    ],
    tip: '공간 상세에서도 그 안에 직접 보관된 물건을 확인하고 등록할 수 있습니다. 같은 공동체 구성원도 물건 정보를 함께 관리합니다.',
  },
  {
    id: 'history', title: '기록·삭제·복원', short: '변경 기록을 확인하고, 삭제한 물건은 휴지통에서 복원하세요.', href: '/app/archive', link: '변경 기록',
    steps: [
      ['전체 기록과 물건별 기록', '변경 기록 화면에서는 공동체의 변경 내역을 봅니다. 물건 상세의 전체 기록 보기에서는 해당 물건의 수정·이동·삭제·복원 기록을 확인합니다.'],
      ['물건 삭제와 복원', '삭제를 확인하면 물건이 휴지통으로 이동합니다. 휴지통에서 원래 공간으로 복원하고, 그 공간이 없어졌다면 새 보관 공간을 선택합니다.'],
      ['공간 삭제 전 내용 정리', '물건이 있는 공간을 삭제할 때는 물건을 다른 공간으로 일괄 이동하거나 휴지통으로 보내는 방식을 선택합니다. 안에 다른 공간이 남아 있으면 먼저 내부 공간을 정리하세요.'],
      ['3D 배치만 지우기', '3D 배치 지우기는 공간의 위치·크기 배치를 해제하는 기능입니다. 공간 이름과 보관 중인 물건을 삭제하는 동작과 구분하세요.'],
    ],
    tip: '변경 기록에는 기능 도입 후 수집된 내역이 표시됩니다. 삭제 전에는 확인창에서 대상과 처리 방법을 확인하세요.',
  },
]

export default function GuidePage() {
  return (
    <>
      <main className="min-h-dvh bg-[#f5f8fd] px-4 py-4 text-slate-950">
        <div className="mx-auto max-w-5xl">
          <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="가이드 메뉴">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold"><BrandIcon size={36} color="#1d4ed8" />우리집 공간록</Link>
            <Link href="/app" className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700">내 공간으로 <ArrowRight size={15} className="inline" /></Link>
          </nav>
          <header className="py-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-violet-700"><BookOpen size={18} /> 사용 가이드</p>
            <h1 className="mt-3 text-3xl font-semibold">내 공간을 기록하는 방법</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">먼저 요약으로 흐름을 보고, 필요한 챕터에서 자세히 확인하세요. 로그인하지 않아도 읽을 수 있습니다.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm"><a href="#quick" className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-700">빠른 요약</a><a href="#chapters" className="rounded-xl border border-slate-200 bg-white px-3 py-2">챕터별 상세 설명</a></div>
          </header>

          <section id="quick" className="scroll-mt-4" aria-labelledby="quick-title">
            <h2 id="quick-title" className="text-xl font-semibold">빠른 요약</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chapters.map((chapter, index) => (
                <li key={chapter.id}>
                  <a href={`#${chapter.id}`} className="block h-full rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50">
                    <span className="text-sm font-semibold text-violet-600">0{index + 1}</span>
                    <h3 className="mt-2 text-base font-semibold">{chapter.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{chapter.short}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet-700">자세히 보기 <ArrowRight size={14} /></span>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section id="chapters" className="mt-8 scroll-mt-4" aria-labelledby="chapters-title">
            <h2 id="chapters-title" className="text-xl font-semibold">챕터별 상세 설명</h2>
            <div className="mt-4 space-y-4">
              {chapters.map((chapter, index) => (
                <article id={chapter.id} key={chapter.id} className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-violet-600">CHAPTER 0{index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold">{chapter.title}</h3>
                  <ol className="mt-4 space-y-4">
                    {chapter.steps.map(([title, description], step) => <li key={title}><h4 className="text-base font-medium">{step + 1}. {title}</h4><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></li>)}
                  </ol>
                  {chapter.id === 'layout' && <HeightExample />}
                  <p className="mt-4 rounded-xl bg-violet-50 p-3 text-sm leading-6 text-violet-950">{chapter.tip}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><Link href={chapter.href} className="inline-flex items-center gap-1 font-medium text-violet-700 hover:underline">{chapter.link} <ArrowRight size={14} /></Link><a href="#quick" className="text-slate-500 hover:underline">요약으로 돌아가기 ↑</a></div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">기능 화면으로 이동할 때는 로그인이 필요합니다. 메뉴 이름과 안내는 현재 제공 중인 기능을 기준으로 작성했습니다.</p>
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  )
}

function HeightExample() {
  return (
    <figure className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <svg viewBox="0 0 420 210" role="img" aria-label="바닥에서 120cm 띄운 높이 60cm 수납장. 위쪽 끝은 180cm입니다." className="mx-auto w-full max-w-lg">
        <path d="M40 185H380M65 20V185" stroke="#64748b" strokeWidth="2" />
        <rect x="120" y="65" width="130" height="55" rx="6" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="2" />
        <path d="M173 88h24" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" />
        <path d="M100 120V185M95 120h10M95 185h10M270 65V120M265 65h10M265 120h10" stroke="#1d4ed8" strokeWidth="2" />
        <g fill="#334155" fontSize="13"><text x="115" y="155">바닥에서 120cm</text><text x="282" y="94">자체 높이 60cm</text><text x="120" y="49">위쪽 끝 180cm</text><text x="320" y="202">바닥 0cm</text></g>
      </svg>
      <figcaption className="text-center text-sm leading-6 text-slate-600">120cm 띄우기 + 자체 높이 60cm = 위쪽 끝 180cm</figcaption>
    </figure>
  )
}

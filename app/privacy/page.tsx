import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandIcon } from '@/components/brand-icon'
import { AppFooter } from '@/components/app-footer'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 우리집 공간록',
  description: '우리집 공간록의 개인정보 처리 항목과 목적, 보관·삭제, 이용자 권리 및 문의 안내입니다.',
}

const sections = [
  {
    title: '1. 운영자와 개인정보 문의',
    paragraphs: ['우리집 공간록 운영자 및 개인정보 보호 담당자는 이정현입니다. 개인정보 열람·정정·삭제·처리정지 및 계정 삭제 요청은 eventietter@naver.com으로 보내 주세요. 요청 처리 시 계정 소유 여부를 확인할 수 있으며, 비밀번호를 이메일로 보내지 마세요.'],
  },
  {
    title: '2. 처리하는 정보와 목적',
    paragraphs: [
      '회원가입·로그인: 이메일, 비밀번호 입력값, 표시 이름, 사용자 식별자 및 인증 정보를 계정 생성·인증과 계정 관리에 사용합니다. 인증은 Supabase Auth로 처리하며 앱의 물건·공간 테이블에 비밀번호를 저장하지 않습니다.',
      '공동체 이용: 공동체 이름, 구성원 관계·역할, 초대 코드 및 참여 내역을 공동 관리와 접근 권한 확인에 사용합니다.',
      '공간·물건 기록: 사용자가 입력한 공간 이름·배치·색상, 물건 이름·보관 위치·수량·단위·분류·메모, 변경 기록과 작성자 식별 정보를 서비스 제공에 사용합니다. 불필요한 개인·민감정보를 메모나 이름에 입력하지 마세요.',
      '서비스 운영: 호스팅·인증 제공업체가 접속 IP, 요청 시각, 기기·브라우저 관련 정보 및 오류·보안 로그를 처리할 수 있습니다. 실제 로그 항목과 보관 설정은 확인 중입니다.',
      '문의: 문의자가 보낸 이메일 주소와 문의 내용을 답변 및 요청 처리에 사용합니다.',
    ],
  },
  {
    title: '3. 수집 경로와 처리 근거',
    paragraphs: ['가입·로그인·서비스 입력 화면과 문의 이메일로 정보를 받으며, 서비스 요청 과정에서 인증·접속 정보가 생성됩니다. 계정 운영과 요청한 서비스 제공에 필요한 처리는 계약 이행 등 적용 가능한 법적 근거를 검토해 운영합니다. 별도 동의가 필요한 처리에는 필요한 안내와 동의 절차를 마련합니다. 이 방침의 열람 자체를 모든 개인정보 처리에 대한 포괄 동의로 간주하지 않습니다.'],
  },
  {
    title: '4. 공동체 내 공개 범위',
    paragraphs: ['선택한 공동체 구성원은 해당 공동체의 공간·물건 정보와 변경 기록을 함께 이용합니다. 표시 이름과 역할 등 구성원 정보도 공동체 화면에 표시됩니다. 초대 코드를 확인하는 사람에게 공동체 이름·대표 정보가 표시될 수 있으므로 초대 링크와 코드를 관리해 주세요. 공동체에 기록할 때 다른 구성원이 볼 수 있다는 점을 고려해 주세요.'],
  },
  {
    title: '5. 보관과 삭제',
    paragraphs: [
      '계정과 서비스 기록은 서비스 제공에 필요한 동안 보관합니다. 수집 목적이 달성되거나 보관 필요가 없어지면 지체 없이 파기하는 것을 원칙으로 하며, 법령에 따라 보존이 필요한 경우 해당 근거와 기간을 따릅니다.',
      '현재 앱에는 자동 회원탈퇴 기능이 없습니다. 계정 삭제는 문의 이메일로 요청할 수 있습니다. 공동체 공유 기록과 작성자 정보의 처리 범위는 요청 시 다른 구성원의 기록과 관련 의무를 검토해 안내합니다.',
      '물건의 삭제 버튼은 휴지통으로 이동하는 기능입니다. 복원을 위해 원래 기록을 보관하므로 영구 파기와 다릅니다. 공간의 삭제 표시나 변경 기록도 즉시 영구 삭제를 의미하지 않습니다.',
      '전자 기록은 복구할 수 없도록 삭제하는 방식으로 파기합니다. 현재 서비스별 로그·백업 보관 기간과 계정 삭제 시 연관 데이터의 구체적인 처리 절차는 확인·정비 중이며, 확정 후 본 방침에 반영합니다.',
    ],
  },
  {
    title: '6. 외부 서비스와 국외 처리',
    paragraphs: [
      'Supabase: 회원 인증, 데이터베이스 및 관련 서비스 운영에 이용합니다. Vercel: 웹사이트 배포·호스팅과 서버 요청 처리에 이용합니다. 문의 메일은 네이버 메일을 통해 수신합니다.',
      '2026년 10월 30일 확인한 Supabase 기본 데이터베이스 저장 지역은 싱가포르(Southeast Asia, ap-southeast-1)입니다. Vercel 함수 실행 지역은 미국 동부 Washington, D.C., USA (iad1 / us-east-1)로 설정되어 있습니다. 이 정보는 기본 DB 저장 및 함수 실행 지역이며 CDN, 로그, 백업 및 지원 업무를 포함한 모든 처리 지역이 같다는 뜻은 아닙니다.',
      '해외 서비스 이용에 따라 국외 보관·처리가 발생할 수 있습니다. 국외 처리의 수령자, 국가, 이전 항목·시점·방법, 목적·보관 기간, 적용 근거와 거부 방법은 실제 설정·계약 확인 후 구체적으로 보완해야 합니다. 국내에만 보관된다고 보장하지 않습니다.',
    ],
  },
  {
    title: '7. 쿠키와 브라우저 저장소',
    paragraphs: [
      '로그인 인증과 로그인 상태 유지 설정에 쿠키를 사용합니다. 로그인 상태 유지 선택 시 지속 쿠키를 사용하며, 선택하지 않은 경우 앱은 인증 쿠키를 세션 방식으로 설정합니다. 브라우저의 세션 복원 설정 등에 따라 동작은 달라질 수 있습니다.',
      '이메일 기억을 선택하면 해당 기기의 localStorage에 이메일을 보관합니다. 이 선택을 해제한 상태로 로그인 요청을 보내거나 브라우저의 사이트 데이터를 지워 삭제할 수 있습니다. 비밀번호를 이메일 기억 기능에 저장하지 않습니다.',
      '현재 시점 저장을 선택하면 계정 식별자별로 3D 회전 각도·상대 확대 및 보기 중심을 이 브라우저의 localStorage에 보관합니다. 기본 시점 초기화 또는 브라우저 사이트 데이터 삭제로 지울 수 있습니다. 이 설정은 서버에 전송하거나 기기 간 동기화하지 않습니다.',
      '브라우저 설정에서 쿠키·사이트 데이터를 삭제하거나 차단할 수 있으나 로그인 기능이 제한될 수 있습니다. 공용 기기에서는 로그아웃 후 필요하면 저장된 이메일과 사이트 데이터도 삭제하세요.',
    ],
  },
  {
    title: '8. 이용자의 권리와 보호 조치',
    paragraphs: [
      '본인 정보의 열람·정정·삭제·처리정지 및 동의 철회 등을 문의처로 요청할 수 있습니다. 표시 이름 등 앱에서 직접 변경할 수 없는 항목도 이메일로 요청해 주세요. 법령에 따라 요청이 제한되는 경우에는 그 사유를 안내합니다.',
      '계정 인증과 공동체 구성원별 데이터 접근 제한을 적용하고 있습니다. 데이터베이스 접근 정책, 운영자 권한, 서비스 설정을 관리하며, 인증 키와 비밀번호를 공개하지 않도록 운영합니다.',
      '권리 침해에 관한 상담·구제 절차는 개인정보 포털 및 개인정보분쟁조정위원회 등 관계 기관의 안내를 이용할 수 있습니다.',
    ],
  },
  {
    title: '9. 방침 변경',
    paragraphs: ['이 문서는 2026년 10월 30일 기준으로 작성한 안내 초안입니다. 외부 서비스의 기타 처리 지역과 구체적인 보관·삭제 절차 확인이 남아 있어 확정된 최종 방침이 아닙니다. 확인된 사항과 운영 변경을 이 페이지에 반영하고, 중요한 변경은 이용자가 확인할 수 있도록 안내합니다.'],
  },
]

export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-dvh bg-[#f5f8fd] px-4 py-4 text-slate-950">
        <div className="mx-auto max-w-3xl">
          <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="개인정보 안내 메뉴">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold"><BrandIcon size={36} color="#1d4ed8" />우리집 공간록</Link>
            <Link href="/guide" className="text-sm font-medium text-violet-700 hover:underline">사용 가이드</Link>
          </nav>
          <header className="py-8">
            <h1 className="text-3xl font-semibold">개인정보처리방침</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">우리집 공간록에서 처리하는 정보와 이용자의 권리를 안내합니다.</p>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">안내 초안 · 운영자 확인: 이정현. 기본 DB는 싱가포르, 서버 함수는 미국 동부로 확인했습니다. 기타 처리 지역과 로그·백업 보관 기간, 구체적인 계정 삭제 절차는 확인 중입니다.</p>
          </header>
          <div className="space-y-4">
            {sections.map((section) => (
              <section key={section.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-600">{paragraph}</p>)}
              </section>
            ))}
          </div>
          <div className="my-4 flex flex-wrap gap-4 text-sm text-violet-700">
            <a href="https://www.privacy.go.kr/" target="_blank" rel="noreferrer" className="hover:underline">개인정보 포털 ↗</a>
            <a href="https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq" target="_blank" rel="noreferrer" className="hover:underline">Supabase 데이터 처리 안내 ↗</a>
            <a href="https://vercel.com/legal/dpa" target="_blank" rel="noreferrer" className="hover:underline">Vercel 데이터 처리 안내 ↗</a>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  )
}

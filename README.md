# 우리집 공간록

집 안의 공간을 층층이 정리하고, 물건을 어디에 보관했는지 기록하고 찾는 웹 앱입니다.

서비스: [storage-basket.vercel.app](https://storage-basket.vercel.app/)

<!-- 스크린샷 추가 예정 -->

## 주요 기능

- **3D 공간 배치** — 공간과 벽·창문을 부모 공간 안에 배치하고, 위에서 보는 평면 편집과 입체 미리보기를 제공합니다.
- **공간 트리와 물건 검색** — 집 안 공간을 계층으로 관리하며, 물건의 이름·분류·보관 위치를 검색하고 해당 공간으로 이동할 수 있습니다.
- **공동체 공유** — 초대 코드·링크로 공동체에 참여하고, 대표는 초대 코드를 다시 발급하거나 구성원을 제외할 수 있습니다.
- **변경 기록** — 물건과 공간의 변경을 공동체 전체 기록과 개별 물건·공간 기록으로 확인합니다.

## 기술 구성

| 영역 | 구성 |
| --- | --- |
| 웹 앱 | Next.js App Router, React, TypeScript |
| 데이터·로그인 | Supabase Auth, PostgreSQL, Row Level Security |
| 화면 데이터 | TanStack Query, Zustand |
| 입력 검증·3D | Zod, React Three Fiber, Three.js, Drei |
| 스타일 | Tailwind CSS |
| 배포·데이터 | GitHub → Vercel → Supabase |

GitHub 저장소의 Next.js 앱을 Vercel에 배포하고, 로그인과 공동체 데이터를 Supabase에서 처리합니다.

## 해결한 문제

- **화면과 API의 배포 구조** — 기존 React(Vite) 화면과 Express API를 각각 다루던 구조를 한 Next.js 앱으로 모았습니다. Vercel에서 화면과 Route Handler를 함께 배포하고 Supabase에 연결하도록 정리했습니다. 전환 당시의 근거와 계획은 [Next.js 전환 계획](docs/nextjs-전환-계획.md)에 남아 있습니다.
- **위치 트리의 무결성** — 공간을 자기 자신이나 하위 공간 안으로 옮기면 순환 구조가 생길 수 있습니다. 앱과 DB에서 이를 막고, 같은 공동체·같은 부모 아래의 중복 이름도 DB 고유 인덱스로 차단합니다.
- **공동체 데이터 분리** — 화면에서 공동체 데이터를 감추는 데 그치지 않고, Supabase RLS 정책과 DB 참조 제약으로 다른 공동체의 공간·물건 접근을 제한합니다. 관련 변경은 [Supabase 마이그레이션](supabase/migrations/)에 기록되어 있습니다.
- **예측 가능한 3D 배치** — 드래그는 10cm 격자에 맞추고 숫자로 세밀하게 조정할 수 있게 했습니다. 부모 범위를 벗어나는 배치를 막고, 기존 공간·벽·창문의 경계에 맞춰 붙이는 규칙을 [배치 조작 검증](tests/plan-gestures.mjs)으로 확인합니다.

## 테스트

`npm test`는 세 테스트 파일의 자동 검증을 실행합니다. 아래 개수는 각 파일에 선언된 테스트 항목 수입니다.

| 파일 | 항목 수 | 확인 내용 |
| --- | ---: | --- |
| [client-regressions.mjs](tests/client-regressions.mjs) | 12 | 로그인 상태, 화면 데이터 캐시, 표시 이름, 물건 기록, 공간 크기·배치 동작의 회귀를 확인합니다. |
| [database-security.mjs](tests/database-security.mjs) | 1 | PGlite 메모리 데이터베이스에 `supabase/migrations/`의 전체 SQL을 순서대로 적용하고, 공동체 간 접근 차단·공간 계층·배치 범위·변경 기록을 검증합니다. |
| [plan-gestures.mjs](tests/plan-gestures.mjs) | 6 | 10cm 맞춤, 부모 경계, 벽·공간에 붙이기, 모서리 크기 조절을 확인합니다. |

DB 테스트는 저장소의 마이그레이션을 별도의 로컬 메모리 DB에서 확인합니다. 운영 Supabase 프로젝트에 접속해 테스트하는 방식은 아닙니다.

## 로컬 실행

필요한 환경 변수 이름은 `.env.example`에서 확인할 수 있습니다. `.env.local`에 값을 설정하되, 키 값은 저장소나 README에 올리지 마세요.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Windows에서 저장소 루트 기준으로 실행합니다.

```text
install.cmd   의존성 설치
dev.cmd       개발 서버 실행 (http://localhost:3000)
```

그 밖의 루트 실행 파일은 다음과 같습니다.

- `build.cmd` — 프로덕션 빌드
- `lint.cmd` — ESLint 검사
- `start.cmd` — 빌드된 앱 실행
- `npm.cmd test` — 자동 테스트 실행

## 문서

- [문서 목차](docs/README.md)
- [결정 기록](docs/결정-기록.md)
- [협업 가이드](docs/협업-가이드.md)
- [인수인계](docs/인수인계.md)
- [QA 점검 체크리스트](docs/QA-점검-체크리스트.md)
- [공동체 관리 QA](docs/공동체-관리-QA.md)
- [공간 입력·수정 공통 규칙](docs/공간-입력-수정-공통-규칙.md)
- [Next.js 전환 계획과 근거](docs/nextjs-전환-계획.md)

## AI 협업 방식

저장소의 [AGENTS.md](AGENTS.md)와 [협업 가이드](docs/협업-가이드.md)에 공통 규칙을 둡니다. 현재 역할 분담은 Claude가 구현하고 Codex가 실제 코드와 diff를 대조해 lint·build·test를 검증하는 방식입니다. 그 결정은 [COLLAB-001](docs/결정-기록.md#collab-001--공통-markdown으로-협업), [COLLAB-002](docs/결정-기록.md#collab-002--명령-실행과-상호-검토-역할-분담), [COLLAB-003](docs/결정-기록.md#collab-003--claude는-코딩-codex는-검증)에 기록했습니다. 제품 판단과 최종 확인은 사람이 합니다.

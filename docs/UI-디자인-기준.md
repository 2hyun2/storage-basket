# 공통 UI 기준

## 브랜드 아이콘

`components/brand-icon.tsx`의 `BrandIcon`을 사용한다. 평면도 안에 수납 손잡이를 넣은 디자인이다.

```tsx
<BrandIcon size={32} />
<BrandIcon size={40} color="#ffffff" bgColor="#1d4ed8" />
<BrandIcon size="2rem" className="text-violet-600" />
```

- `size`: 숫자는 px, 문자열은 CSS 크기. 기본 24px.
- `color`: 선 색. 기본 `currentColor`로 상위 글자 색을 따른다.
- `bgColor`: 생략하면 투명. 배경은 CSS 래퍼로 지정해도 된다.
- 헤더·인트로·로그인·회원가입은 이 컴포넌트를 공유한다.
- 파비콘·모바일 아이콘·OG 이미지는 같은 디자인을 정적 파일로 제공한다.

사용자가 수정한 인트로 `app/page.tsx`를 기준으로 한다.

- 일반 페이지 제목: 30px (`text-3xl`), 600 (`font-semibold`), 기본 자간.
- 인트로 대표 문구만 데스크톱에서 48px까지 확대한다.
- 카드 제목: 18~20px. 본문과 입력 설명: 14px, 줄 높이 24px.
- 보조 정보: 12px. 주요 문구에만 굵기를 주고 본문은 기본 굵기를 쓴다.
- 카드 내부 여백: 최대 16px. 작은 입력·목록 항목은 8~12px.
- 관련 항목 사이: 8~12px. 섹션 내부 구분: 16px.
- 카드와 폼 모서리: 12px (`rounded-xl`). 작은 아이콘은 8px.
- 주요 포인트: 파랑. 클래스 이름은 `violet-*`를 사용한다(아래 색상 클래스). 사용자가 지정한 공간 색상은 별개로 유지한다.
- 3D 치수·좌표·캔버스 크기는 일반 UI 간격 조정 대상에 포함하지 않는다.

소개 화면의 큰 섹션 간 여백과 주요 버튼 크기는 인트로 목적에 맞게 유지한다.

## 색상 클래스

결정: [UI-001](결정-기록.md). 2026-11-10 기준 코드에서 확인한 사용 패턴을 표준으로 정리했다.

| 용도 | Tailwind 클래스 | 비고 |
| --- | --- | --- |
| 주요 포인트(브랜드 파랑) | `violet-*` | `app/globals.css`의 `@theme`에서 `violet-*`를 파랑 값으로 재정의한다. 예: `violet-600` = `#1d4ed8` |
| 무채색(글자·테두리·보조) | `slate-*` | `gray-*`, `zinc-*`, `neutral-*`는 쓰지 않는다 |
| 오류·삭제 경고 | `rose-*` | |
| 물건 관련 보조 강조 | `sky-*` | 등록 화면의 물건 카드 등 |
| 앱 페이지 배경 | `bg-[#f5f8fd]` | `app/app/layout.tsx`와 각 페이지 `main` |

- `blue-*`를 쓰지 않는다. 실제 색이 비슷한 다른 팔레트라 화면에 두 계열의 파랑이 섞인다.
- 2026-11-10 정현 요청으로 기존 `blue-*` 11개 토큰(`app/page.tsx`, `components/space/placement-step-navigation.tsx`, `components/space/saved-view-controls.tsx`, `components/space/space-interior-3d.tsx`)을 같은 숫자의 `violet-*`로 교체했다. 재정의 값 기준으로 50~400은 거의 같은 색이고, 600 이상은 한 단계 진하게 보일 수 있다.
- `gray-*`, `zinc-*`, `neutral-*`는 같은 검색에서 소스 사용 0개였다.
- `globals.css`의 `--color-violet-*` 값을 바꾸면 앱 전체 포인트 색이 바뀐다. 변경은 결정 기록을 거친다.
- 사용자 공간 색상(`lib/space/colors.ts`의 6색, DB `locations.color_hex`)은 브랜드 색이 아니다. 실제 보라 계열 HEX를 포함하며 위 재정의와 무관하다.

## 레이아웃 클래스

- 앱 페이지 콘텐츠 폭: `mx-auto max-w-5xl`. 바깥 여백: `px-2 py-4 sm:px-4`.
- 카드 기본형: `rounded-xl border bg-white p-4 shadow-sm`. 테두리는 `border-slate-200`, 강조 시 `border-violet-100`.
- 본문·설명: `text-sm leading-6 text-slate-500`. 페이지 제목: `text-3xl font-semibold`.

## 공간이 없는 계정의 물건 등록

- 현재 공동체의 사용 가능한 공간이 0개이면 물건 등록 카드·버튼·입력 폼 대신 `SpaceRequiredNotice`를 표시한다. 등록 선택 화면, 물건 목록, 물건 등록 다이얼로그에 같은 안내를 사용한다.
- 제목은 “물건을 보관할 공간부터 만들어 주세요”로, `text-xl sm:text-2xl font-semibold` 크기로 강조한다. “공간 먼저 등록하기” 버튼은 `/app/space/create`로 연결한다. 집 전체 크기가 미설정이면 기존 공간 등록 흐름에서 크기 설정으로 안내한다.
- 공간 조회 중에는 로딩 안내, 조회 실패 시에는 오류 안내를 보여준다. 조회 전 빈 배열을 공간 0개로 판단하지 않는다.
- 공간 생성 후에는 기존 물건 등록을 제공한다. `/app/items?create=1` 직접 진입도 같은 조건을 따른다. 공간이 없어도 물건 휴지통 링크는 유지한다.
- 결정: [UI-002](결정-기록.md).

# 수납바구니 Next.js 전환 계획

현재 구현 상태, 확정 규칙, 다음 순서는 [작업 현황 및 다음 계획](./작업-현황-및-다음-계획.md)에서 관리한다. 이 문서는 Next.js 전환 당시의 설계 근거와 세부 API·DB 계획을 보관한다.

## 현재 보존 대상

- Git 커밋 이력: 기존 React/Vite·Express 구현은 GitHub 이력으로 남긴다.
- Supabase 프로젝트: `locations`, `items` 테이블과 실제 데이터, 위치명 중복 방지 인덱스를 그대로 유지한다.
- 제품 규칙: 위치 트리, 물건 CRUD, 위치 삭제 전 물건 이동, 같은 부모 아래 위치명 중복 금지.

기존 로컬 구현 파일과 Render 배포 설정은 제거한다. Supabase DB나 GitHub의 과거 커밋은 제거하지 않는다.

## 목표 구조

```text
GitHub
  ↓ 자동 배포
Vercel
  ├─ Next.js App Router 화면
  └─ app/api/* Route Handler
         ↓
     Supabase PostgreSQL
```

- 화면과 API를 단일 Next.js 프로젝트에서 관리한다.
- Vercel이 정적 화면을 CDN에서 즉시 제공한다.
- 서버 전용 Supabase 키는 Vercel 환경 변수에서만 사용한다.
- 기존 Render 서비스는 Vercel 배포와 CRUD 검증 후 삭제한다.

## 전환 작업 순서

1. 루트에 Next.js(App Router, TypeScript, Tailwind CSS) 프로젝트를 만든다.
2. Supabase 서버 클라이언트와 환경 변수 템플릿을 만든다.
3. 기존 Express API를 다음 Route Handler로 옮긴다.
   - `app/api/locations/route.ts`
   - `app/api/locations/[id]/route.ts`
   - `app/api/items/route.ts`
   - `app/api/items/[id]/route.ts`
   - `app/api/health/route.ts`
4. 위치·물건 타입과 유효성 검증(Zod)을 공통 모듈로 분리한다.
5. React 화면을 `app/`과 `components/`로 옮기고 API 호출을 연결한다.
6. 모바일 위치 선택·추가·관리, 중복 제출 방지, 위치명 중복 오류 표시를 다시 검증한다.
7. Vercel에 GitHub 저장소를 연결하고 다음 환경 변수를 등록한다.
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
8. Vercel 공개 주소에서 위치·물건 CRUD와 모바일 화면을 확인한다.
9. 검증이 끝난 뒤 Render 서비스를 삭제한다.

## 데이터 및 보안 원칙

- 브라우저에는 `SUPABASE_SERVICE_ROLE_KEY`를 포함하지 않는다.
- DB 제약은 클라이언트 검증과 별개로 유지한다.
- 현재는 로그인 없는 소규모 공유 도구다. API 공개 범위와 인증 도입은 Next.js 전환 후 별도 단계로 결정한다.
- 기존 물건 중복 기록은 자동 삭제하지 않는다. 사용자가 화면에서 정리한다.

## 확정 데이터 모델

### 계정과 공동체

```text
auth.users (Supabase Auth)
  └─ profiles
  └─ home_members ── homes
                       ├─ locations
                       ├─ items
                       └─ activity_events
```

| 테이블 | 핵심 필드 | 역할 |
| --- | --- | --- |
| `profiles` | `id`, `display_name` | Auth 사용자 표시 정보 |
| `homes` | `id`, `name`, `owner_id` | 개인·가족·공동체 단위 |
| `home_members` | `home_id`, `user_id`, `role`, `joined_at` | Home 구성원과 권한 |
| `locations` | `id`, `home_id`, `parent_id`, `name`, 생성·수정·삭제 메타데이터 | 위치 트리 |
| `items` | `id`, `home_id`, `location_id`, 물건 정보, 생성·수정·삭제 메타데이터 | 물건 기록 |
| `activity_events` | `home_id`, `actor_id`, `subject_type`, `subject_id`, `event_type`, 스냅샷, `operation_id` | 변경 이력 원본 |

`home_members.role`은 처음에 `owner`, `member` 두 역할을 사용한다. 가입한 사용자는 개인 Home 하나를 자동 생성하고, 그 Home의 `owner`가 된다.

위치와 물건은 모두 `home_id`를 가진다. 개별 사용자 ID만으로 소유를 판단하지 않고, 현재 사용자가 해당 Home의 member인지 확인한다. 한 사용자가 여러 Home에 참여할 수 있다.

### 위치와 물건 규칙

- 같은 부모 아래 위치명은 대소문자·앞뒤 공백을 무시하고 중복을 금지한다.
- 다른 부모 아래에서는 같은 위치명을 허용한다.
- 위치를 자신 또는 하위 위치로 옮길 수 없다.
- 하위 위치가 있는 위치는 1차에서는 삭제하지 못한다.
- 물건은 이름 중복을 허용한다.
- 1차 물건 이동은 전체 수량 이동만 지원한다. 부분 수량 이동은 2차 기능이다.
- 위치와 물건은 실제 행을 즉시 지우지 않고 `deleted_at`, `deleted_by`를 기록하는 소프트 삭제를 사용한다.

### 기록과 아카이브

`activity_events`는 단일 기록 원본이다. 화면은 이 원본을 세 가지 방식으로 조회한다.

```text
물건 상세 기록
→ subject_type = item AND subject_id = 현재 물건

위치 상세 기록
→ subject_type = location AND subject_id = 현재 위치

Home 전체 아카이브
→ home_id = 현재 Home, 최신순
```

각 이벤트는 `before_snapshot`, `after_snapshot` JSON을 둬서 이름 변경·이동·삭제 뒤에도 당시 내용을 표시한다. 여러 행을 함께 바꾸는 작업은 같은 `operation_id`를 사용한다.

예: 위치를 삭제하며 물건을 이동하면 위치 삭제 이벤트와 각 물건 이동 이벤트가 같은 `operation_id`로 저장된다.

## API와 JSON 설계

모든 사용자 API는 로그인 세션에서 사용자 ID를 읽는다. 요청 본문의 `userId`, `ownerId`, `actorId`는 받지 않는다.

### 인증과 Home

```text
POST /api/auth/signup
{ "email": "user@example.com", "password": "...", "displayName": "현" }

POST /api/auth/login
{ "email": "user@example.com", "password": "..." }

POST /api/auth/logout

GET /api/homes
→ [{ "id", "name", "role", "memberCount" }]

POST /api/homes
{ "name": "우리 집" }
```

회원가입 성공 시 `profile`, 개인 Home, owner membership을 하나의 DB 작업으로 생성한다.

### 위치

```text
GET /api/homes/:homeId/locations

POST /api/homes/:homeId/locations
{ "name": "거실", "parentId": null }

PATCH /api/locations/:locationId
{ "name": "거실 수납장", "parentId": "uuid 또는 null" }

DELETE /api/locations/:locationId
{ "itemDestinationIds": { "item-uuid": "destination-location-uuid" } }
```

위치 삭제는 위치 확인, 물건 이동, 위치 소프트 삭제, 이벤트 기록을 하나의 DB 트랜잭션으로 처리한다.

### 물건

```text
GET /api/homes/:homeId/items

POST /api/homes/:homeId/items
{
  "title": "AA 건전지",
  "locationId": "uuid",
  "quantity": 4,
  "options": {
    "unit": "개",
    "category": "생활용품",
    "tags": ["예비품"],
    "note": "충전지 아님"
  }
}

PATCH /api/items/:itemId
{ "title", "locationId", "quantity", "options" }

DELETE /api/items/:itemId
```

### 기록

```text
GET /api/homes/:homeId/activity-events?cursor=&limit=30
GET /api/items/:itemId/activity-events?cursor=&limit=30
GET /api/locations/:locationId/activity-events?cursor=&limit=30
```

아카이브는 cursor 기반 페이지네이션, 이벤트 종류·작업자·날짜 필터를 지원한다.

## DB 작업 원칙

물건 이동, 위치 삭제, 복구처럼 여러 테이블을 함께 변경하는 작업은 Next API가 여러 요청을 순서대로 보내지 않는다. Supabase PostgreSQL RPC 함수에서 트랜잭션으로 처리한다.

```text
요청
→ 세션·Home member 권한 확인
→ PostgreSQL RPC
   ├─ 데이터 변경
   ├─ activity_events 생성
   └─ 모두 성공 시 commit, 하나라도 실패 시 rollback
```

RLS는 사용자가 member인 Home 데이터만 읽고 바꾸도록 제한한다. `activity_events`는 클라이언트가 직접 추가·수정·삭제하지 못하고, 검증된 RPC만 기록을 생성한다.

## 추후 기능: 가입 초대 코드

회원가입 화면에 `초대 코드가 있으신가요?` 선택 흐름을 추가한다. 유효한 코드를 입력하면 바로 가입시키지 않고, 대상 Home 정보를 확인하는 단계를 거친다.

```text
회원가입
→ “초대 코드가 있으신가요?”
→ 코드 입력
→ 코드 검증
→ “행복한 우리집에 참여할까요?” 확인 화면
   - Home 이름: 행복한 우리집
   - 대표자: 이**
→ [참여하기] 또는 [내 Home 만들기]
→ 최종 가입 완료
```

대표자 정보는 개인 정보 노출을 줄이기 위해 프로필 표시 이름을 일부 마스킹한다. 예를 들어 `이현수`는 `이**`, `홍길동`은 `홍**`로 보인다.

- `home_invites` 테이블: `code`, `home_id`, `role`, `expires_at`, `max_uses`, `used_count`, `created_by`를 관리한다.
- 코드는 추측하기 어려운 랜덤 문자열로 만들고, 만료·사용 횟수·활성 상태를 서버/RPC에서 검증한다.
- 새 사용자 생성, 초대 코드 검증, `home_members` 추가, 활동 기록 생성은 하나의 DB 트랜잭션으로 처리한다.
- 코드가 없거나 유효하지 않으면 지금처럼 개인 기본 Home을 생성한다.
- 코드가 유효해도 사용자가 확인 화면에서 `내 Home 만들기`를 고르면 기존 Home에 가입하지 않는다.
- 추후 owner가 구성원 화면에서 초대 코드 생성·폐기·복사·사용 현황 확인을 할 수 있게 한다.

## 추후 기능: 계층형 수납 지도

수납 지도는 집 전체를 한 화면의 3D 모델로 보여 주지 않는다. 현재 위치의 바로 아래 자식만 그린 뒤, 사용자가 하나를 선택하면 그 위치의 내부 장면으로 순차 진입한다.

```text
집 전체 평면도
→ 거실 · 부엌 · 안방
→ 거실 내부의 TV장 · 수납장 · 소파
→ TV장 내부의 서랍 · 칸
→ 서랍 내부의 상자 · 물건
```

- 첫 화면은 집 전체 평면도이며 방의 상대 위치만 표시한다.
- 방을 누르면 그 방의 내부 배치도로 진입한다.
- 보관소를 누르면 그 내부 구조로 진입한다.
- 상단 breadcrumb로 `우리 집 > 거실 > TV장 > 오른쪽 서랍`을 표시하고, 어느 단계에서나 상위 계층으로 돌아갈 수 있게 한다.
- 물건은 최하위 위치에서 목록·수량·메모를 우선 보여 주며, 첫 버전에서는 물건마다 3D 모델을 만들지 않는다.

논리 데이터인 `locations`의 부모-자식 구조는 그대로 사용한다. 시각 배치 데이터는 위치 자체가 아니라 **부모 장면에서 자식이 어디에 보일지**를 저장한다.

```text
space_layouts
- home_id
- location_id nullable  -- null이면 집 전체 장면, 값이 있으면 해당 위치 내부 장면
- view_mode             -- plan, elevation, cabinet, box

space_placements
- layout_id
- child_location_id
- x, y, z
- width, height, depth
- rotation_y
- display_kind
```

이 구조면 같은 `거실`은 집 전체 평면도에서는 방으로, 거실 내부 장면에서는 자식 보관소들의 부모로 자연스럽게 동작한다.

### 집 전체 평면도 규칙

최상위 Home 장면은 건축 도면을 정밀하게 재현하지 않고, 고정된 직사각형 캔버스 안에 직사각형 구역만 배치한다. 화면용 샘플 그리드는 표현 전용이며, 실제 공간 배치 데이터는 m 단위다.

- 첫 버전의 방·통로·보관 구역은 모두 사각형만 허용한다. 자유형 다각형은 필요성이 확인된 뒤 추가한다.
- 배치 좌표와 크기는 픽셀이 아니라 캔버스 기준 그리드 값 또는 백분율로 저장해 모바일과 데스크톱에서 같은 구조를 유지한다.
- 위치 데이터가 연결된 구역은 색상을 채우고, 아직 배정하지 않은 바닥 영역은 중립 배경색으로 둔다.
- 색상은 임의 색이 아니라 구역 종류별로 통일한다. 예: 방은 보라 계열, 주방은 주황 계열, 수납 구역은 파랑 계열, 통로는 회색 계열.
- 구역에는 이름과 하위 위치·물건 수를 표시한다. 예: `거실 · 보관소 3개 · 물건 18개`.
- 모든 장면에서 구조물 사각형은 서로 겹칠 수 없다. 부모·자식 관계여도 같은 장면에 그려지는 사각형은 겹침 검사 대상이다.
- 자식 구조물은 부모 경계의 모든 방향에서 최소 1cm(`0.01m`)만큼 떨어져야 한다. 따라서 자식의 최대 크기는 `parent.width - 0.02`, `parent.height - 0.02`, `parent.depth - 0.02`다.
- 위치 수정 또는 드래그 저장 시 부모 경계·여백·형제 간 겹침을 서버에서 함께 검증한다. 하나라도 위반하면 저장하지 않고 원래 배치로 되돌린다.

#### 공간 수정과 부모 크기 검증

공간의 생성·이동·크기 수정은 해당 공간만 검사하지 않는다. 저장 전 아래 순서로 부모와 자식 관계를 함께 검증한다.

```text
공간 수정 요청
→ 수정 대상이 부모의 1칸 여백 안에 있는지
→ 같은 부모의 형제 공간과 겹치지 않는지
→ 부모를 줄이는 수정이면 모든 기존 자식이 여백 안에 남는지
→ 조상 공간까지 경계 규칙이 유지되는지
→ 모두 통과할 때만 저장 및 기록 생성
```

부모가 작아서 저장할 수 없으면 자동으로 부모 크기를 바꾸지 않는다. 사용자가 의도하지 않게 다른 형제 공간을 밀어낼 수 있기 때문이다. 대신 구조화된 오류와 필요한 최소 부모 크기를 반환한다.

```text
오른쪽 서랍을 가로 42로 늘릴 수 없습니다.
현재 부모 TV장 가로: 50
필요한 최소 가로: 54
먼저 TV장의 크기를 늘리거나 다른 서랍을 이동해 주세요.
```

최소 부모 크기는 자식들의 배치로 계산한다.

```text
필요한 최소 부모 너비 = 가장 오른쪽 자식의 (x + width) + 오른쪽 여백 1
필요한 최소 부모 높이 = 가장 아래 자식의 (y + height) + 아래 여백 1
```

부모 크기를 줄일 때도 같은 계산을 사용해, 자식 하나라도 밖으로 나가거나 여백이 1칸보다 작아지면 저장을 막는다. 최상위 Home 캔버스는 부모가 없으므로, Home 평면도 크기 편집 화면에서 직접 확장한다.

#### 공간 생성 순서

공간은 부모가 이미 존재할 때만 만들 수 있다. Home은 회원가입 시 자동으로 생성되는 시스템 루트이며, 사용자가 만드는 첫 공간도 Home의 자식이다.

```text
Home (자동 생성)
→ 거실 생성 가능
→ 거실이 존재한 뒤 TV장 생성 가능
→ TV장이 존재한 뒤 오른쪽 서랍 생성 가능
→ 오른쪽 서랍이 존재한 뒤 내부 상자 생성 가능
```

- 공간 등록의 부모 선택 목록에는 현재 Home 안에 이미 저장된 공간만 보여 준다.
- 부모 공간이 삭제되었거나 다른 Home에 속하면 생성·이동 요청을 거절한다.
- `parent_id`가 `null`인 위치는 Home 바로 아래의 첫 단계 공간만 의미한다. 데이터상 부모는 `home_id`로 고정된다.
- 공간 이름, 부모 선택, 지도 배치 데이터의 저장은 하나의 요청에서 처리하며 부모 확인이 실패하면 어떤 공간도 생성하지 않는다.

### 공간·물건과 등록 방식의 분리

공간과 물건은 같은 트리 노드가 아니다. 공간은 다른 공간·물건을 담는 계층이고, 물건은 하나의 공간에 보관되는 독립 데이터다.

```text
Location (공간)
우리 집 → 거실 → TV장 → 오른쪽 서랍

Item (물건)
AA 건전지, 충전 케이블, 설명서
→ 각각 하나의 location_id에 연결
```

등록 진입점은 먼저 대상과 방식을 차례대로 묻는다.

```text
[등록]
→ 공간 등록 / 물건 등록
→ 간편 등록 / 지도 배치 등록
```

UI에서는 `3D 등록`보다 `지도 배치 등록`이라는 이름을 쓴다. 집·방 단계는 평면도이고 보관함 내부는 입체 표현일 수 있으므로, 어느 장면에서도 통하는 표현이다.

| 대상 | 간편 등록 필수값 | 지도 배치 등록 추가 필수값 |
| --- | --- | --- |
| 공간 | 이름, 부모 공간 | 현재 장면, x, y, z, 너비, 높이, 깊이, 표시 형태 |
| 물건 | 이름, 보관 공간, 수량 | 없음 |

공간의 지도 배치는 처음부터 `x`, `y`, `z`, `width`, `height`, `depth`를 모두 받는다. 사용자는 cm로 입력하고 서버는 m로 변환해 저장한다. 예를 들어 `120cm`는 DB에 `1.2`로 저장한다.

좌표축은 `x`가 좌우, `y`가 높이, `z`가 앞뒤다. 1·2계층 공간은 데이터에 세 축과 세 크기를 모두 저장하지만, 화면에서는 위에서 내려다본 평면도로 `x·z`만 사용해 그린다. 3계층부터 수납장·서랍 내부 장면을 입체로 표시할 때 `y·height·depth`까지 사용한다.

DB와 공간 계산의 내부 단위는 m로 고정하되, 사용자가 보는 모든 값은 cm로 통일한다. 등록·수정 폼, 공간 상세 패널, 최소 부모 크기 오류, 활동 기록 모두 m 값을 cm로 변환해서 표시한다.

```text
DB: width = 1.2
화면: 너비 120cm

DB: 필요한 최소 부모 너비 = 1.54
화면: 필요한 최소 부모 너비 154cm
```

DB도 논리 데이터와 시각 배치를 분리한다.

```text
locations             -- 공간의 이름·부모 관계
items                 -- 물건의 이름·보관 공간·수량
space_placements      -- 공간이 부모 장면 어디에 보이는지
```

물건에는 좌표가 없다. 물건은 `location_id`로 보관 공간만 지정하고, 해당 공간을 선택했을 때 상세 패널·목록에서 보여 준다. 간편 공간 등록은 `locations`만 만들고, 지도 배치 공간 등록은 같은 트랜잭션에서 `locations`와 `space_placements`를 함께 만든다. 따라서 텍스트로만 등록한 공간도 나중에 지도에 배치할 수 있다.

## 완료 기준

- Vercel 주소에서 첫 화면이 Render 무료 서버 재기동 대기 없이 열린다.
- 위치와 물건 CRUD가 기존 Supabase 데이터에 정상 반영된다.
- 모바일에서 위치 선택·추가·관리 기능을 쓸 수 있다.
- Render 없이 GitHub → Vercel → Supabase 흐름이 동작한다.

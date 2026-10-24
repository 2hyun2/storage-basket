# 수납바구니 Next.js 전환 계획

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

## 완료 기준

- Vercel 주소에서 첫 화면이 Render 무료 서버 재기동 대기 없이 열린다.
- 위치와 물건 CRUD가 기존 Supabase 데이터에 정상 반영된다.
- 모바일에서 위치 선택·추가·관리 기능을 쓸 수 있다.
- Render 없이 GitHub → Vercel → Supabase 흐름이 동작한다.

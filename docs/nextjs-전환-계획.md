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

## 완료 기준

- Vercel 주소에서 첫 화면이 Render 무료 서버 재기동 대기 없이 열린다.
- 위치와 물건 CRUD가 기존 Supabase 데이터에 정상 반영된다.
- 모바일에서 위치 선택·추가·관리 기능을 쓸 수 있다.
- Render 없이 GitHub → Vercel → Supabase 흐름이 동작한다.

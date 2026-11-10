<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 우리집 공간록 공통 협업

- 작업 전 `docs/협업-가이드.md`, `docs/인수인계.md`를 읽는다. 문서 목차는 `docs/README.md`다.
- `package.json`, 실제 코드, 관련 migration과 최신 기능 문서를 확인한다. 오래된 현황 문서만 보고 현재 구현을 추정하지 않는다.
- 기능 문서와 구현이 다르면 차이를 기록하고 사용자 요청에 해당하는 범위에서 해결한다. 불명확한 제품 결정을 임의로 확정하지 않는다.
- 사용자에게 한국어로 필요한 내용만 간결하게 전달한다. 기존 변경을 보존하고 관련 범위만 수정한다.
- 완료 후 `docs/인수인계.md`에 변경 파일, 검증 결과, 남은 사항을 갱신한다. 제품·구조 결정 변경은 `docs/결정-기록.md`에 남긴다.
- Claude의 진입점은 `CLAUDE.md`이며, 공통 규칙의 원본은 이 파일과 `docs/협업-가이드.md`다.

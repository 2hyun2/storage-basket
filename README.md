# 수납바구니

집 안 물건의 보관 위치를 트리 구조로 기록하고 검색하는 웹앱입니다. 텍스트 기반 위치 관리가 원본이며, 이후 선택적으로 직육면체 기반 3D 공간 보기를 추가할 예정입니다.

## 새 컴퓨터에서 시작하기

필수 프로그램:

- Git
- Node.js
- VS Code
- Docker Desktop은 Docker 작업을 시작할 때 설치

저장소를 받은 뒤 실행합니다.

```powershell
git clone https://github.com/2hyun2/storage-basket.git
cd storage-basket\front
npm ci
npm run dev
```

개발 서버 주소는 기본적으로 `http://localhost:5173`입니다.

검증 명령:

```powershell
npm run lint
npm run build
```

## 현재 상태

- React + Vite + Tailwind CSS 4 프론트엔드
- 위치 트리 조회와 위치 노드 추가
- 물건 목록, 위치 필터, 검색, 정렬
- 물건 상세 보기와 임시 물건 등록
- Zustand 기반 UI 상태
- 브라우저 메모리 기반 임시 데이터
- 새로고침 시 추가한 위치와 물건은 사라짐
- Express, Supabase, Docker는 아직 연결하지 않음

## 문서

- [인수인계](docs/인수인계.md)
- [구조 메모](docs/구조-메모.md)
- [작업 목록](docs/작업-목록.md)

## 저장소 주의사항

`node_modules`, `dist`, `.env`와 Obsidian의 개인 작업창 상태는 Git에 포함하지 않습니다. 실제 비밀값은 `.env`에 두고, 공유가 필요한 변수 이름만 `.env.example`에 기록합니다.

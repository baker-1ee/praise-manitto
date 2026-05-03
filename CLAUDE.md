# Praise Manitto

익명 팀 칭찬 교환 웹앱. 스프린트 단위로 마니또를 배정하고, 공개 전까지 발신자를 숨긴다.

**스택:** Next.js 14 App Router · TypeScript · Prisma + PostgreSQL(Supabase) · NextAuth.js · Tailwind + shadcn/ui · Slack API

## 작업 전 필독

1. `memory/` 디렉토리를 먼저 읽어라 — 현재 컨텍스트와 진행 상태가 담겨 있다.
2. 상세 규칙은 `docs/ai/` 에 있다.

## 핵심 규칙 (요약)

- DB 쿼리는 반드시 Prisma를 통해 작성한다. 날 SQL 금지.
- API 라우트는 `getServerSession()` → Zod `safeParse()` → Prisma 순서를 지킨다.
- 전역 상태 라이브러리(Redux, Zustand 등) 도입 금지.
- 마니또 배정 로직(`lib/manito.ts`)은 스프린트 생성 시점 외에는 절대 호출하지 않는다.
- 커밋 요청 시에는 현재 브랜치가 main 브랜치라면, 반드시 main 브랜치에서 새 브랜치를 먼저 만들고 커밋한다. 브랜치명은 작업 성격에 맞게 `feat/...`, `fix/...`, `refactor/...` 형식으로 짓는다. `main` 브랜치에 직접 커밋하지 않는다.

## 상세 문서

| 문서 | 내용 |
|------|------|
| `docs/ai/conventions.md` | 코딩 컨벤션, 네이밍, 금지 패턴 |
| `docs/ai/architecture.md` | 모듈 구조, 의존성 흐름, 설계 결정 |
| `docs/ai/modes/` | 작업 모드별 지침 (architect / code / review / debug) |

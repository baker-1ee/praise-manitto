# 아키텍처

## 모듈 구조 및 의존성 흐름

```
Browser
  │
  ├── Server Components (app/(dashboard)/, app/admin/, app/reveal/)
  │     └── Prisma (직접 쿼리, 렌더링 시점)
  │
  ├── Client Components ('use client')
  │     └── fetch → API Routes
  │
  └── API Routes (app/api/)
        ├── NextAuth  (인증·세션)
        ├── Zod       (입력 검증)
        ├── Prisma    (DB 쿼리)
        └── Slack     (알림, 비동기·선택적)
```

## 핵심 모듈

### lib/auth.ts
NextAuth 설정 파일. Credentials Provider로 이메일+비밀번호 인증.
JWT 콜백에서 `role`, `teamId`, `name`을 세션에 주입한다.
`authOptions`를 export해 모든 API 라우트가 import한다.

### lib/prisma.ts
Prisma 싱글톤. `globalThis.__prisma`에 캐싱해 개발 환경 핫리로드 시 연결 폭발 방지.

### lib/manito.ts
`assignManito(userIds: string[])` — Fisher-Yates 셔플 기반 완전 순열(Derangement) 알고리즘.
자기 자신에게 배정되지 않도록 보장. 스프린트 생성 시 **1회만** 호출.

### lib/slack.ts
두 가지 기능:
- `sendPraiseNotification()` — 칭찬 수신 시 DM 발송 (Bot Token)
- `sendRevealWebhook()` — 스프린트 공개 시 채널 Webhook 발송

### lib/celebration.ts
`canvas-confetti` 래퍼. 스프린트 공개 화면에서 사용.

## 데이터 모델 관계

```
Team ──< Sprint ──< ManitoPair ──< Praise
 │                    │
 └──< User           (sender → User, receiver → User)
       │
       └── InviteToken
```

- `ManitoPair`: `sprintId + giverId` 복합 유니크 — 스프린트당 1인 1배정 보장
- `Praise`: `manitoPairId`로 연결, 발신자는 공개 시점 전까지 API에서 숨김
- `InviteToken`: 팀 초대 링크용, 사용 후 `usedAt` 기록

## 역할(Role) 접근 제어

```
ADMIN   → 전체 팀·스프린트·유저 관리
LEADER  → 소속 팀의 스프린트·멤버 관리
MEMBER  → 칭찬 작성·조회 (본인 데이터만)
```

API 라우트에서 `session.user.role` + `session.user.teamId`로 검사.

## 레이아웃 그룹

| 그룹 | 경로 | 특징 |
|------|------|------|
| `(auth)` | /login, /register | 인증 불필요 |
| `(dashboard)` | /, /praise/write, /praises/* | 일반 사용자, 로그인 필요 |
| `admin` | /admin/* | ADMIN·LEADER 전용 |
| 없음 | /reveal/[id] | 공개 페이지, 인증 불필요 |

## 핵심 설계 결정

1. **익명성 보장** — `Praise.giverId`는 DB에 저장하지만, 공개 전 API 응답에서 제외.
2. **DB 연결 분리** — Supabase Transaction Pooler(6543)는 앱용, Direct(5432)는 마이그레이션용.
3. **상태 관리 미니멀** — 전역 상태 없음. 로딩 오버레이용 Context 1개만 사용.
4. **Slack 선택적** — 환경변수 미설정 시 알림 없이 정상 동작.
5. **서버 컴포넌트 우선** — 데이터 fetch는 서버에서, 클라이언트 번들 최소화.

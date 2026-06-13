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
  ├── API Routes (app/api/)
  │     ├── NextAuth  (인증·세션)
  │     ├── Zod       (입력 검증)
  │     ├── Prisma    (DB 쿼리)
  │     └── lib/email (알림, 비동기·선택적)
  │
  └── Cron / Webhook (app/api/cron/, app/api/email/inbound)
        ├── cron/nudge        — 칭찬 미작성자에게 독려 메일 (vercel.json 스케줄)
        ├── cron/watch-renew  — Gmail Pub/Sub watch 6시간마다 갱신
        └── email/inbound     — Gmail push 알림 수신 → 이메일 답장을 칭찬으로 변환
```

## 핵심 모듈

### lib/auth.ts
NextAuth 설정 파일. Credentials Provider로 `name`(로그인 ID) + 비밀번호 인증.
JWT 콜백에서 `role`, `teamId`, `mustChangePassword`, `name`을 세션에 주입한다.
`authOptions`를 export해 모든 API 라우트가 import한다.

### lib/prisma.ts
Prisma 싱글톤. `globalThis.__prisma`에 캐싱해 개발 환경 핫리로드 시 연결 폭발 방지.

### lib/manito.ts
`assignManito(userIds: string[])` — Fisher-Yates 셔플 기반 완전 순열(Derangement) 알고리즘.
반환값은 `{ manitoId, targetId }[]`. 자기 자신에게 배정되지 않도록 보장.
스프린트 생성 시 **1회만** 호출.

### lib/celebration.ts
`canvas-confetti` 래퍼. `fireConfetti()` — 스프린트 공개 화면 진입 시 폭죽 효과.

### lib/email.ts
Nodemailer 래퍼. `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS` 미설정 시 모든 발송이 조용히 no-op.
- `sendSprintStartEmail` — 스프린트 시작 시 마니또 배정 안내
- `sendPraiseReceivedEmail` — 칭찬 수신 알림 (이메일 회신으로 작성된 칭찬 포함)
- `sendPraiseNudgeEmail` — 칭찬 미작성 독려 (이메일 회신으로 바로 칭찬 작성 가능 안내)
- `sendSprintRevealEmail` — 마니또 공개 알림

### lib/gmail.ts
Gmail API(OAuth2) 래퍼. 이메일 회신으로 칭찬을 수집하는 기능의 핵심.
- `fetchNewMessages(historyId)` — Gmail history API로 신규 메일 조회, 인용/서명 제거(`stripQuotedReply`) 후 본문만 추출
- `markAsRead(messageId)` — 처리 완료 메일 읽음 처리 (중복 처리 방지)
- `setupWatch()` — Gmail Pub/Sub watch 등록 (`cron/watch-renew`에서 6시간마다 호출)
- `getOrCreateHistoryId()` — 현재 historyId 조회 (초기 셋업용)

## 데이터 모델 관계

```
Team ──< User
 │        │
 └──< Sprint ──< ManitoPair >── User (manito / target)
          │
          └──< Praise >── User (sender / receiver)

User ──< InviteToken (1:1)
```

- `ManitoPair`: `(sprintId, manitoId)`, `(sprintId, targetId)` 이중 unique — 스프린트당 1인 1배정(부여/수신 모두) 보장
- `Praise`: `fromUserId`(발신자)·`toUserId`(수신자)로 `User`를 직접 참조. 공개(`REVEALED`) 전까지 발신자 정보는 API 응답에서 제외
- `InviteToken`: 팀 초대 링크용, 사용 후 `usedAt` 기록
- `User.email`: 선택 필드. 입력되어 있으면 이메일 알림 수신 + Gmail 회신으로 칭찬 작성 가능

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
| `(dashboard)` | /, /praise/write, /praises/*, /sprints, /change-password | 일반 사용자, 로그인 필요 |
| `admin` | /admin/* | ADMIN·LEADER 전용 |
| 없음 | /reveal/[sprintId] | 공개 페이지, 인증 불필요 |

## 이메일 기반 칭찬 작성/수집 흐름

1. `cron/nudge`(vercel.json 스케줄)가 칭찬 미작성 마니또에게 독려 메일 발송 — "이 메일에 회신하면 칭찬이 전달됩니다" 안내 포함
2. 사용자가 메일에 회신
3. Gmail이 Pub/Sub로 `/api/email/inbound`에 push 알림 전달
4. `fetchNewMessages`로 본문 추출(인용/서명 제거) → 발신자 이메일로 `User` 매칭 → 활성 `ManitoPair` 조회
5. `Praise` 생성 (1분 내 동일 내용 중복 방지) → `sendPraiseReceivedEmail`로 대상자에게 알림
6. `markAsRead`로 처리 완료 표시

## 핵심 설계 결정

1. **익명성 보장** — `Praise.fromUserId`는 DB에 저장하지만, 공개 전 API 응답에서 제외.
2. **DB 연결 분리** — Supabase Transaction Pooler(6543)는 앱용, Direct(5432)는 마이그레이션용.
3. **상태 관리 미니멀** — 전역 상태 없음. 로딩 오버레이용 Context(`ApiLoadingProvider`) 1개만 사용.
4. **이메일 선택적** — `EMAIL_HOST` 등 환경변수 미설정 시 알림 없이 정상 동작. Gmail 연동도 `GMAIL_*` 미설정 시 단순히 미사용.
5. **서버 컴포넌트 우선** — 데이터 fetch는 서버에서, 클라이언트 번들 최소화.

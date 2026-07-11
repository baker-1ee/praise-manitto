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
`assignManito(userIds: string[], pairWeights?: Map<string, number>)` — 팀 전체가 하나의
순환(Hamiltonian cycle)을 이루도록 강제하는 최소 비용 순환 탐색 알고리즘.
반환값은 `{ manitoId, targetId }[]`. 순환 구조상 인접 원소가 모두 서로 달라
자기 자신 배정 불가(derangement)를 구조적으로 만족하며, 2인 상호 배정(A→B, B→A 동시 발생)도
발생하지 않는다(단, 팀원이 2명뿐이면 구조적으로 불가피).
`N ≤ 8`은 `(N-1)!` 전수 탐색으로 완전 최적해, `N > 8`은 무작위 시작점 최대 10개에서
그리디 최근접 이웃 구성 + 2-opt 로컬서치를 거쳐 최저 비용 결과를 채택한다(N=100까지 0.3초 이내).

`computePairWeights(recentSprintsMostRecentFirst, currentMemberIds, halfLifeSprints=2)` —
최근 스프린트(최신순)의 manito↔target 조합에 지수 감쇠 가중치를 누적한다.
`weight = 0.5 ^ ((몇 스프린트 전인가 - 1) / halfLifeSprints)`로 최근일수록 무겁게,
오래될수록 부드럽게 잊혀진다. 하드 컷오프가 없어 배정 불가 상황(폴백) 자체가 생기지 않는다.
현재 팀원 목록에 둘 다 남아있는 쌍만 반영하므로 탈퇴자는 자동 제외되고, 신규 합류자는
이력이 없어 가중치 0(최우선 배정 후보)이 된다.

`recentSprintLookback(teamSize)` — 가중치 계산에 반영할 과거 스프린트 개수를
`clamp(⌈(N-1)/2⌉, 3, 20)`으로 계산한다. 지수 감쇠로 이 창 밖의 이력은 가중치가
사실상 0에 수렴하므로, 이 값은 배정 가능 여부를 좌우하지 않고 조회 쿼리 비용의
상한을 두는 역할만 한다.

호출부(`api/admin/sprints`)에서 `recentSprintLookback`으로 조회할 스프린트 개수를 정하고,
해당 기간의 `ManitoPair`를 `computePairWeights`로 넘겨 가중치를 만든 뒤 `assignManito`에
전달한다. 스프린트 생성 시 **1회만** 호출.

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

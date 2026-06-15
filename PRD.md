# PRD: 칭찬 마니또 서비스

## 1. 개요

### 1.1 서비스 소개
팀원들이 2주 스프린트 단위로 무작위 마니또를 배정받아 상대방을 익명으로 칭찬하고, 스프린트 종료 시 전체 공개를 통해 팀 문화를 활성화하는 웹 서비스.

### 1.2 목표
- 팀원 간 긍정적 관계 형성 및 심리적 안전감 제공
- 2주마다 반복되는 칭찬 루프로 팀 문화 정착
- 회고 시간에 재미있는 공개 이벤트로 팀 에너지 고조

### 1.3 대상 사용자
- **MEMBER**: 개발팀 팀원 — 마니또 확인, 칭찬 작성/수신
- **LEADER**: 팀장 — 소속 팀의 스프린트·팀원 관리, 공개 권한
- **ADMIN**: 서비스 관리자 — 전체 팀/유저/스프린트 관리

---

## 2. 기술 스택 (Claude Code 구현 기준)

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI 컴포넌트 | shadcn/ui + Tailwind CSS |
| Backend | Next.js API Routes |
| DB | PostgreSQL (Prisma ORM) |
| 인증 | NextAuth.js (Credentials Provider — 사용자명/비밀번호) |
| 알림 | 이메일 (Nodemailer SMTP) + Gmail API (이메일 회신으로 칭찬 작성/수집) |
| 배포 | Vercel (Frontend + API) ← **확정** |
| DB/Auth 호스팅 | Supabase (PostgreSQL) ← **확정** |

---

## 3. 핵심 기능 명세

### 3.1 사용자 인증

#### 구현 완료
- **사용자명 + 비밀번호** 로그인 (이메일 없음, name 필드가 로그인 ID)
- 팀원은 LEADER/ADMIN이 팀 관리 화면에서 추가 → 초대 토큰 링크 생성
- 초대 링크로만 회원가입 가능 (이메일 발송 없음, 링크 직접 공유)
- JWT 세션 (NextAuth.js Credentials Provider)
- 세션에 `id`, `role`, `teamId`, `mustChangePassword` 포함
- 초기 비밀번호 `0000` → 첫 로그인 후 변경 배너 표시
- 자동 로그인 체크박스 (localStorage 기반, 기본 체크) — localStorage 우선 시도 후 prefillName 처리
- **카카오톡 인앱 브라우저 감지**: UA에 `KAKAOTALK` 포함 시 외부 브라우저 유도 배너 표시
  - Android: Chrome intent URL(`intent://...#Intent;scheme=https;package=com.android.chrome;end`)로 자동 이동
  - iOS: 하단 메뉴 → "기본 브라우저로 열기" 안내 텍스트 표시

#### 화면
- `/login` — 로그인 페이지 (placeholder 없음)
- `/register?token={초대토큰}` — 초대 링크로만 가입
- `/change-password` — 비밀번호 변경

---

### 3.2 스프린트 관리 (LEADER/ADMIN 전용)

#### 구현 완료
- LEADER는 소속 팀, ADMIN은 전체 팀 스프린트 관리
- 스프린트 생성: 이름, 시작일, 종료일 → 마니또 자동 배정 즉시 실행
- 팀(Team)에 속한 멤버로만 배정
- 한 팀에 하나의 활성 스프린트만 존재
- 스프린트 상태: `PENDING` → `ACTIVE` → `REVEALED` → `CLOSED`
- 스프린트 삭제 시 연관 데이터(pair, praise) cascade 삭제
- 스프린트 목록에서 pair 수, praise 수 통계 표시

#### 마니또 배정 알고리즘 (`/src/lib/manito.ts`)
```
입력: 팀원 N명
조건: 자기 자신에게 배정 불가 (derangement)
      A→B 이면 B→A도 허용 (단방향)
방법: Fisher-Yates 셔플 + derangement 검증
출력: { manitoId, targetId }[] (N개)
```

#### 화면
- `/admin/sprints` — 스프린트 목록, 생성, 공개 버튼

---

### 3.3 내 마니또 확인

#### 요구사항
- 로그인한 사용자는 현재 활성 스프린트에서 **자신이 마니또인 대상(1명)** 만 확인 가능
- 다른 사람의 마니또 정보는 절대 노출되지 않음
- 마니또 대상의 이름, 프로필 사진, 한 줄 소개 표시

#### 화면
- `/` (홈) — 현재 스프린트 정보 + 내 마니또 대상 카드
  - 카드 앞면: "이번 스프린트 마니또가 배정되었어요!"
  - 카드 클릭 시 뒤집기 애니메이션으로 대상 공개
  - 진행 중 스프린트 없을 때: 직전 공개 스프린트가 있으면 "마니또가 공개됐어요!" 카드 표시, 없으면 "스프린트 없음" 안내

---

### 3.4 칭찬 작성

#### 요구사항
- 스프린트 기간 중 내 마니또 대상에게 칭찬을 작성할 수 있다
- 1 스프린트 당 최소 1회, 최대 무제한 (가이드: 주 1~2회 권장)
- 칭찬 내용은 **발신자 익명** 처리
- 작성 즉시 대상에게 이메일 알림 발송 (수신자에게 `email`이 등록된 경우)
- 칭찬 카테고리 태그 선택 (선택): `기술력`, `협업`, `커뮤니케이션`, `리더십`, `성장`, `기타`
- **이메일 회신으로 칭찬 작성** (선택, Gmail 연동 시): 앱에 접속하지 않고도 독려 메일에 회신만 하면 칭찬이 등록됨 (`3.6` 참조)

#### 칭찬 데이터 구조
```
Praise {
  id: string
  sprintId: string
  fromUserId: string      // 작성자 (마니또) — 공개 전 API 응답에서 제외
  toUserId: string        // 수신자 (마니또 대상)
  content: string         // 칭찬 내용 (10~500자)
  categories: string[]    // 태그
  createdAt: DateTime
}
```

#### 화면
- `/praise/write` — 칭찬 작성 폼 (내 마니또 대상 자동 지정), 전송 완료 후 보낸 칭찬 목록으로 자동 이동
- `/praises/sent` — 내가 작성한 칭찬 목록 (발신 내역)
  - 진행 중 스프린트 + 마니또 배정 상태: 해당 스프린트에서 해당 마니또 대상에게 보낸 칭찬만 표시
  - 그 외(스프린트 없음, 미배정): 전체 발신 내역 표시

---

### 3.5 받은 칭찬 확인

#### 요구사항
- 나에게 온 칭찬 목록 확인 가능 (발신자 이름 비공개, 익명)
- 알림 수신 후 서비스에서도 재확인 가능
- 스프린트 공개 전까지는 "익명의 팀원"으로 표시

#### 화면
- `/praises/received` — 받은 칭찬 목록
  - 칭찬 카드: 날짜, 카테고리 태그, 내용, "익명의 팀원"

---

### 3.6 알림 발송

모든 이메일 발송은 `lib/email.ts`(Nodemailer)를 통하며, `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS` 등이 설정되지 않으면 조용히 no-op 처리된다 (선택 기능). 수신자에게 `email`이 등록되어 있지 않으면 발송하지 않는다.

#### 구현 완료

**스프린트 시작 알림** (`sendSprintStartEmail`)
- 스프린트 생성(=마니또 배정) 즉시 전체 멤버에게 발송
- "마니또가 배정되었습니다, 칭찬을 전달해주세요" 안내 + 서비스 접속 링크

**칭찬 수신 알림** (`sendPraiseReceivedEmail`)
- 칭찬 작성(앱 또는 이메일 회신) 즉시 수신자에게 발송
- "익명의 마니또가 칭찬을 남겼어요" + 칭찬 본문 미리보기

**칭찬 독려 알림** (`sendPraiseNudgeEmail`, `cron/nudge`)
- 스프린트 진행 중 칭찬을 아직 작성하지 않은 마니또에게 정기 발송 (vercel.json 스케줄)
- "이 메일에 회신하면 칭찬이 전달됩니다" 안내 포함

**스프린트 공개 알림** (`sendSprintRevealEmail`)
- 공개 시 전체 멤버에게 발송, `/reveal/{sprintId}` 링크 안내

#### 이메일 회신으로 칭찬 작성 (Gmail 연동)

- `cron/nudge`/공개 안내 메일에 **회신**하면, 본문이 그대로 칭찬 내용으로 등록됨
- Gmail Pub/Sub push → `/api/email/inbound`에서 처리:
  1. 발신자 이메일로 `User` 조회
  2. 해당 유저의 활성 `ManitoPair` 조회 (없으면 무시)
  3. 메일 본문에서 인용/서명 제거 후 `Praise` 생성 (1분 내 동일 내용 중복 방지)
  4. 대상자에게 `sendPraiseReceivedEmail` 발송
- `cron/watch-renew`가 6시간마다 Gmail watch를 갱신 (Gmail watch는 7일 후 만료)

---

### 3.7 팀 관리 (LEADER/ADMIN 전용) — 신규

#### 구현 완료
- ADMIN: 팀 생성/삭제, 전체 팀 조회
- LEADER/ADMIN: 소속 팀 멤버 추가/삭제, 역할(LEADER/MEMBER) 지정
  - LEADER는 자신의 팀(`session.user.teamId === params.id`)에만 멤버 추가 가능
- 멤버 추가 시 `email`(선택) 입력 가능 — 등록 시 이메일 알림 + Gmail 회신 칭찬 작성 대상이 됨
- 멤버 추가 시 초대 토큰 자동 생성 → 초대 링크 복사 버튼
- 멤버 상태 표시: `미가입` (비밀번호 없음) / `가입 완료`
- 관리자가 멤버 비밀번호를 `0000`으로 초기화 가능
- 초대 링크 재발급 가능
- 모바일 다이얼로그: 키보드 노출 시 상단 정렬(`top-[5%]`)로 입력 필드 가림 방지

#### 화면
- `/admin/teams` — 팀 목록, 멤버 관리 (이름/이메일/역할)
- `/admin/users` — 전체 유저 관리, 이메일 등록/수정

---

### 3.8 OpenGraph 썸네일

#### 구현 완료
- **루트 페이지 OG** (`/src/app/opengraph-image.tsx`): purple-pink 그라디언트 카드, 💌, "칭찬 마니또" — 카카오톡 링크 공유 시 기본 썸네일
- **초대 링크 개인화 OG**: `/register?token={초대토큰}` 공유 시 수신자 이름이 포함된 썸네일
  - `/src/app/api/og/route.tsx` (edge runtime): `?name=홍길동` → "길동님을 초대합니다!" 렌더링 (`name.length >= 3 ? name.slice(1) : name`)
  - `page.tsx` `generateMetadata`에서 토큰으로 DB 조회 → 절대 URL(`https://manitto.jinung.com/api/og?name=...`)로 OG 이미지 지정
  - 토큰 없음/만료 시 기본 OG(`/api/og`) 폴백

---

### 3.9 스프린트 공개 (LEADER/ADMIN 전용)

#### 구현 완료
- LEADER/ADMIN이 "공개" 버튼 클릭 → 스프린트 상태 `REVEALED`
- 공개 후 팀 전체(+비로그인 사용자)가 마니또 관계 + 칭찬 내역 조회 가능
- 공개 시 전체 멤버에게 이메일 알림 자동 발송 (`3.6` 참조)

#### 화면
- `/reveal/{sprintId}` — 스프린트 공개 결과 (상세 3.10)

---

### 3.10 공개 결과 화면 (하이라이트 기능)

#### 구현 완료
```
[상단] 스프린트 이름 + 기간 + 총 칭찬 개수
       페이지 진입 시 Confetti 효과 (lib/celebration.ts)

[목록] 멤버별 카드 (기본 전체 펼침)
  - 각 카드: 멤버 정보 + "○○님의 마니또는 △△님" + 받은 칭찬 목록
  - 카드 클릭 시 펼침/접힘 토글
  - 칭찬 카드 4회 연속 클릭 시 이스터에그(빙그르르 애니메이션)
```

#### 관련 파일
- `/src/app/reveal/[sprintId]/page.tsx` — 공개 결과 화면
- `/src/lib/celebration.ts` — `fireConfetti()` (Confetti 효과)
- `/reveal/{sprintId}` — 비로그인 상태에서도 접근 가능 (auth 불필요)

---

### 3.11 칭찬 조르기

#### 구현 완료
- 진행 중인 스프린트에서, 내 마니또(나에게 칭찬을 줘야 하는 사람)에게 "칭찬을 기다리고 있어요" 독려 메일을 보낼 수 있음
- 하루 1회로 제한 (`localStorage` 기반)
- 마니또에게 `email`이 없으면 전송 실패 처리

#### 화면
- `PraiseNudgeButton` 컴포넌트 — 홈/스프린트 화면에 노출

#### 관련 API
- `POST /api/praises/nudge` — `sendPraiseNudgeEmail` 발송

---

## 4. 데이터 모델

```prisma
model Team {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  members   User[]
  sprints   Sprint[]
}

model User {
  id                 String    @id @default(cuid())
  name               String?   @unique  // 로그인 ID로 사용
  email              String?            // 선택: 이메일 알림 + Gmail 회신 칭찬 작성용
  avatarUrl          String?
  bio                String?
  password           String?            // bcrypt 해시, 초대 전 null
  mustChangePassword Boolean   @default(false)
  role               Role      @default(MEMBER)
  teamId             String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  team               Team?     @relation(fields: [teamId], references: [id])
  inviteToken        InviteToken?

  manitoOf        ManitoPair[] @relation("Manito")
  manitoTarget    ManitoPair[] @relation("Target")
  sentPraises     Praise[]     @relation("Sender")
  receivedPraises Praise[]     @relation("Receiver")
}

enum Role {
  ADMIN
  LEADER
  MEMBER
}

model InviteToken {
  id        String    @id @default(cuid())
  token     String    @unique @default(cuid())
  userId    String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Sprint {
  id        String       @id @default(cuid())
  name      String
  teamId    String?
  startDate DateTime
  endDate   DateTime
  status    SprintStatus @default(PENDING)
  createdAt DateTime     @default(now())
  team      Team?        @relation(fields: [teamId], references: [id])
  pairs     ManitoPair[]
  praises   Praise[]
}

enum SprintStatus {
  PENDING
  ACTIVE
  REVEALED
  CLOSED
}

model ManitoPair {
  id       String @id @default(cuid())
  sprintId String
  manitoId String  // 칭찬해주는 사람
  targetId String  // 칭찬받는 사람

  sprint Sprint @relation(fields: [sprintId], references: [id])
  manito User   @relation("Manito", fields: [manitoId], references: [id])
  target User   @relation("Target", fields: [targetId], references: [id])

  @@unique([sprintId, manitoId])
  @@unique([sprintId, targetId])
}

model Praise {
  id         String   @id @default(cuid())
  sprintId   String
  fromUserId String
  toUserId   String
  content    String   @db.Text  // 10~500자
  categories String[]
  createdAt  DateTime @default(now())

  sprint   Sprint @relation(fields: [sprintId], references: [id])
  sender   User   @relation("Sender", fields: [fromUserId], references: [id])
  receiver User   @relation("Receiver", fields: [toUserId], references: [id])
}
```

---

## 5. API 엔드포인트

### 인증
| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/auth/[...nextauth]` | NextAuth 핸들러 (로그인) | Public |
| POST | `/api/register` | 회원가입 (초대 토큰 필수) | Public |
| GET | `/api/invite/validate` | 초대 토큰 유효성 검증 | Public |
| POST | `/api/user/change-password` | 비밀번호 변경 | Auth |

### 칭찬
| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/praises` | 칭찬 작성 + 수신자 이메일 알림 발송 | Auth |
| GET | `/api/praises/received` | 받은 칭찬 목록 | Auth |
| POST | `/api/praises/nudge` | 내 마니또에게 독려 메일 발송 (하루 1회) | Auth |

### 스프린트 (사용자)
| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/sprints/{id}/reveal` | 공개 데이터 조회 (REVEALED/CLOSED만) | Public |

### 관리자 — 스프린트
| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/admin/sprints` | 스프린트 목록 (LEADER: 팀 범위) | Leader/Admin |
| POST | `/api/admin/sprints` | 스프린트 생성 + 마니또 자동 배정 | Leader/Admin |
| PUT | `/api/admin/sprints/{id}/reveal` | 스프린트 공개 | Leader/Admin |
| DELETE | `/api/admin/sprints/{id}` | 스프린트 삭제 (cascade) | Leader/Admin |

### 관리자 — 팀/멤버
| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/admin/teams` | 팀 목록 | Leader/Admin |
| POST | `/api/admin/teams` | 팀 생성 | Admin |
| DELETE | `/api/admin/teams/{id}` | 팀 삭제 | Admin |
| POST | `/api/admin/teams/{id}/members` | 멤버 추가 + 초대 토큰 생성 | Leader/Admin |
| DELETE | `/api/admin/teams/{id}/members` | 멤버 삭제 | Leader/Admin |
| POST | `/api/admin/teams/{id}/reset-password` | 비밀번호 0000 초기화 | Leader/Admin |
| POST | `/api/admin/teams/{id}/invite` | 초대 링크 재발급 | Leader/Admin |

### 관리자 — 기타
| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/admin/users` | 전체 유저 목록 | Admin |
| PATCH | `/api/admin/users/{id}` | 유저 정보 수정 (이메일 등) | Admin |

### Cron / Webhook
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/cron/nudge` | 칭찬 미작성 마니또에게 독려 메일 발송 (vercel.json 스케줄) | `Authorization: Bearer {CRON_SECRET}` |
| GET | `/api/cron/watch-renew` | Gmail Pub/Sub watch 갱신 (6시간 주기) | `Authorization: Bearer {CRON_SECRET}` |
| POST | `/api/email/inbound` | Gmail push 알림 수신 → 이메일 회신을 칭찬으로 등록 | Pub/Sub push (인증 없음, 항상 `{ ok: true }` 반환) |

---

## 6. 화면 목록 (Page Routes)

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/login` | 로그인 | Public |
| `/register` | 회원가입 (초대 토큰 필요) | Public |
| `/` | 홈 — 현재 스프린트 + 마니또 카드 + 칭찬 조르기 | Auth |
| `/sprints` | 스프린트 목록 | Auth |
| `/praise/write` | 칭찬 작성 (마니또 대상 자동 지정) | Auth |
| `/praises/sent` | 내가 보낸 칭찬 목록 | Auth |
| `/praises/received` | 받은 칭찬 목록 (공개 전 익명) | Auth |
| `/change-password` | 비밀번호 변경 | Auth |
| `/reveal/{sprintId}` | 스프린트 공개 결과 — 멤버별 마니또 관계 + 칭찬 | Public (REVEALED/CLOSED만) |
| `/admin/sprints` | 스프린트 관리 (생성/공개/삭제) | Leader/Admin |
| `/admin/teams` | 팀 및 멤버 관리 (이메일 등록 포함) | Leader/Admin |
| `/admin/users` | 전체 유저 관리 | Admin |

---

## 7. 비기능 요구사항

### 보안
- 마니또 배정 정보는 본인 것만 API 응답에 포함
- 칭찬 발신자 정보는 `REVEALED` 상태 전 API에서 절대 반환 금지
- 관리자 API는 Role 기반 미들웨어로 보호

### 성능
- 팀 규모 16~50명 MVP 타겟, 과도한 최적화 불필요
- 알림 발송 실패 시 로그 기록 (재시도는 2차)

### UX
- 모바일 반응형 필수 (팀원이 폰으로도 확인)
- 공개 화면은 회고 미팅 화면에 띄울 용도 → 데스크탑 와이드 레이아웃 최적화

---

## 8. 구현 현황

### 완료 (Phase 1 — 핵심 기능)
- [x] 인증 — 사용자명/비밀번호 로그인, 초대 링크 회원가입
- [x] 팀/멤버 관리 — 팀 CRUD, 초대 토큰, 비밀번호 초기화
- [x] 스프린트 생성 + 마니또 자동 배정 (Fisher-Yates)
- [x] 내 마니또 확인 화면 (플립 카드 애니메이션)
- [x] 칭찬 작성 (10~500자), 전송 후 보낸 칭찬 목록으로 자동 이동
- [x] 받은 칭찬 / 보낸 칭찬 목록 (진행 중 스프린트 기준 필터링)
- [x] 스프린트 공개 + 멤버별 마니또 관계·칭찬 카드 (비로그인 접근 허용)
- [x] 공개 화면 진입 시 Confetti 효과

### 완료 (Phase 2 — 알림 & UX)
- [x] 이메일 알림 (스프린트 시작/칭찬 수신/공개) — Nodemailer, 미설정 시 no-op
- [x] 자동 로그인 (localStorage, 기본 체크)
- [x] 카카오톡 인앱 브라우저 감지 → 외부 브라우저 유도 배너
- [x] OpenGraph 썸네일 — 루트 페이지 기본 OG + 초대 링크 개인화 OG
- [x] LEADER 권한으로 소속 팀 멤버 추가 가능
- [x] 홈 화면 — 직전 공개 스프린트 카드 표시 (진행 중 스프린트 없을 때)
- [x] 모바일 다이얼로그 키보드 UX 개선

### 완료 (Phase 3 — 이메일 기반 칭찬 & 디자인)
- [x] Purple/Violet 디자인 시스템 리브랜드
- [x] 칭찬 조르기 (마니또에게 독려 메일, 하루 1회)
- [x] 칭찬 독려 cron (`cron/nudge`) — 정기적으로 미작성자에게 독려 메일
- [x] Gmail 연동 — 이메일 회신으로 칭찬 작성/수집 (`/api/email/inbound`, `cron/watch-renew`)
- [x] 스프린트 목록 페이지 (`/sprints`)
- [x] 공개 화면 칭찬 카드 4연속 클릭 이스터에그

### 미구현 (Phase 4 — 개선)
- [ ] 공개 화면 통계 카드 UI (topSender/topReceiver 등, API는 일부만 구현)
- [ ] 스프린트 아카이브 / 히스토리 페이지
- [ ] 팀원 초대 이메일 자동 발송 (현재: 링크 수동 공유)

---

## 9. 인프라 & 배포 전략 (확정: Vercel + Supabase)

### 9.1 비용 목표
- **목표**: 월 $0 ~ $5 (도메인 제외)
- **도메인**: 연 $10~15 (Cloudflare Registrar 기준)

---

### 9.2 확정 스택

```
[사용자 브라우저]
       ↓ HTTPS
[Vercel] ← Next.js 서버리스 자동 배포 + SSL + 글로벌 CDN
       ↓
[Supabase] ← PostgreSQL (Prisma Transaction Pooler 연결)
```

| 항목 | 비용 | 비고 |
|------|------|------|
| Vercel | 무료 (Hobby) | 개인 프로젝트 무료, 팀이면 Pro $20/월 |
| Supabase | 무료 (Free tier) | 500MB DB, 50K MAU |
| 도메인 | $10~15/년 | Cloudflare Registrar 추천 |
| **합계** | **도메인만 유료** | |

> Supabase Free tier는 7일 미사용 시 프로젝트 일시정지됨  
> → UptimeRobot 무료 플랜으로 5분마다 ping 설정 권장

---

### 9.3 Prisma + Supabase 연결 구성

Supabase Project Settings → Database에서 두 URL 확인:

| 환경변수 | 용도 | 포트 |
|----------|------|------|
| `DATABASE_URL` | 앱 런타임 (Transaction Pooler) | 6543 |
| `DIRECT_URL` | 마이그레이션 전용 (Direct) | 5432 |

`prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

### 9.4 Vercel 배포 절차

```bash
# 1. Vercel CLI 설치 및 연결
npm i -g vercel
vercel link

# 2. 환경변수 등록 (Vercel Dashboard에서도 가능)
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL       # 예: https://manitto.yourdomain.com
vercel env add EMAIL_HOST
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add CRON_SECRET

# 3. 배포
vercel --prod

# 4. DB 마이그레이션 (로컬에서 최초 1회)
npx prisma migrate deploy
```

### 9.5 커스텀 도메인 연결

1. Vercel Dashboard → 프로젝트 → Settings → Domains
2. 도메인 추가 (예: `manitto.yourdomain.com`)
3. Cloudflare DNS → CNAME 레코드 추가 (Vercel 안내값)
4. Vercel 자동 SSL 발급

---


## 10. 환경변수

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://...pooler.supabase.com:6543/...  # 런타임 (Transaction Pooler)
DIRECT_URL=postgresql://...pooler.supabase.com:5432/...    # 마이그레이션 전용

# NextAuth
NEXTAUTH_SECRET=<random-base64-32>
NEXTAUTH_URL=https://your-domain.vercel.app

# 이메일 발송 (선택, 미설정 시 알림 없이 동작)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-password
EMAIL_FROM="칭찬 마니또 <noreply@praise-manitto.app>"

# Gmail 연동 (선택, 이메일 회신으로 칭찬 작성/수집)
GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxx
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_REFRESH_TOKEN=xxx
GMAIL_PUBSUB_TOPIC=projects/your-project/topics/gmail-inbound

# Cron (선택)
CRON_SECRET=random-secret-for-cron-auth
```
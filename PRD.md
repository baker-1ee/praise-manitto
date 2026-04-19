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
| 알림 | Slack Incoming Webhook + Bot Token DM |
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
- 자동 로그인 체크박스 (localStorage 기반)

#### 화면
- `/login` — 로그인 페이지
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

---

### 3.4 칭찬 작성

#### 요구사항
- 스프린트 기간 중 내 마니또 대상에게 칭찬을 작성할 수 있다
- 1 스프린트 당 최소 1회, 최대 무제한 (가이드: 주 1~2회 권장)
- 칭찬 내용은 **발신자 익명** 처리
- 작성 즉시 대상에게 알림 발송 (Slack)
- 칭찬 카테고리 태그 선택 (선택): `기술력`, `협업`, `커뮤니케이션`, `리더십`, `성장`, `기타`

#### 칭찬 데이터 구조
```
Praise {
  id: string
  sprintId: string
  fromUserId: string      // 작성자 (마니또)
  toUserId: string        // 수신자 (마니또 대상)
  content: string         // 칭찬 내용 (최대 500자)
  category: string[]      // 태그
  createdAt: DateTime
  isAnonymous: true       // 항상 익명
}
```

#### 화면
- `/praise/write` — 칭찬 작성 폼 (내 마니또 대상 자동 지정)
- `/praises/sent` — 내가 작성한 칭찬 목록 (발신 내역)

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

#### 구현 완료

**칭찬 수신 알림 (Slack DM)**
- Bot Token(`SLACK_BOT_TOKEN`)으로 수신자에게 DM 발송
- 수신자의 `slackUserId`가 설정된 경우에만 발송
- 발송 내용:
  ```
  💌 익명의 팀원이 칭찬을 보냈어요!
  [태그: 기술력, 협업]
  "오늘 코드 리뷰에서 정말 꼼꼼하게 봐줘서 감사했어요!"
  👉 칭찬 확인하기: {서비스 URL}
  ```

**스프린트 공개 알림 (Slack 채널)**
- Incoming Webhook(`SLACK_WEBHOOK_URL`)으로 팀 채널에 발송
- 발송 내용: `🎉 *{스프린트명}* 칭찬 마니또가 공개되었습니다!`

**Slack 사용자 연동 (관리자)**
- `/admin/teams` 에서 Slack 워크스페이스 멤버 목록 동기화
- 앱 유저와 Slack 유저 매핑 (드롭다운 선택)
- `/api/admin/slack/users` — Slack API로 워크스페이스 멤버 조회

---

### 3.7 팀 관리 (LEADER/ADMIN 전용) — 신규

#### 구현 완료
- ADMIN: 팀 생성/삭제, 전체 팀 조회
- LEADER/ADMIN: 소속 팀 멤버 추가/삭제, 역할(LEADER/MEMBER) 지정
- 멤버 추가 시 초대 토큰 자동 생성 → 초대 링크 복사 버튼
- 멤버 상태 표시: `미가입` (비밀번호 없음) / `가입 완료`
- 관리자가 멤버 비밀번호를 `0000`으로 초기화 가능
- 초대 링크 재발급 가능

#### 화면
- `/admin/teams` — 팀 목록, 멤버 관리, Slack 연동

---

### 3.8 스프린트 공개 (LEADER/ADMIN 전용)

#### 구현 완료
- LEADER/ADMIN이 "공개" 버튼 클릭 → 스프린트 상태 `REVEALED`
- 공개 후 팀 전체가 마니또 관계도 + 칭찬 내역 조회 가능
- 공개 시 Slack 채널 알림 자동 발송 (`3.6` 참조)

#### 화면
- `/reveal/{sprintId}` — 스프린트 공개 결과 (상세 3.9)

---

### 3.9 공개 결과 화면 (하이라이트 기능)

#### 구현 완료
```
[상단] 스프린트 이름 + 기간

[중앙] 마니또 관계도 (커스텀 SVG 원형 배치)
  - 팀원 아바타 원형 배치 (팀원 수에 따라 반지름 자동 조정)
  - 화살표: A → B (A가 B의 마니또), 화살표에 칭찬 개수 배지
  - 화살표 순차 등장 애니메이션 (350ms 간격)
  - 팀원 클릭 시 마니또 관계 + 칭찬 내역 패널 표시
  - 팀원 클릭 시 Confetti + 박수 음향 + 이름 TTS 축하 이벤트

[통계] API 반환값 (topSender, topReceiver, topCategory, totalPraises)
```

#### 관련 파일
- `/src/components/relation-graph.tsx` — 커스텀 SVG 관계도
- `/src/lib/celebration.ts` — Confetti + Web Audio + Speech Synthesis

---

## 4. 데이터 모델

```prisma
model Team {
  id      String   @id @default(cuid())
  name    String
  members User[]
  sprints Sprint[]
}

model User {
  id                 String   @id @default(cuid())
  name               String   @unique  // 로그인 ID로 사용 (이메일 없음)
  avatarUrl          String?
  bio                String?
  slackUserId        String?
  password           String?           // bcrypt 해시, 초대 전 null
  mustChangePassword Boolean  @default(false)
  role               Role     @default(MEMBER)
  teamId             String?
  team               Team?    @relation(fields: [teamId], references: [id])
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
  token     String    @unique
  userId    String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Sprint {
  id        String       @id @default(cuid())
  name      String
  teamId    String?
  startDate DateTime
  endDate   DateTime
  status    SprintStatus @default(PENDING)
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
| POST | `/api/praises` | 칭찬 작성 + Slack DM 발송 | Auth |
| GET | `/api/praises/received` | 받은 칭찬 목록 | Auth |

### 스프린트 (사용자)
| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/sprints/{id}/reveal` | 공개 데이터 조회 (REVEALED/CLOSED만) | Auth |

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
| GET | `/api/admin/slack/users` | Slack 워크스페이스 멤버 조회 | Leader/Admin |

---

## 6. 화면 목록 (Page Routes)

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/login` | 로그인 | Public |
| `/register` | 회원가입 (초대 토큰 필요) | Public |
| `/` | 홈 — 현재 스프린트 + 마니또 카드 + 칭찬 통계 | Auth |
| `/praise/write` | 칭찬 작성 (마니또 대상 자동 지정) | Auth |
| `/praises/sent` | 내가 보낸 칭찬 목록 | Auth |
| `/praises/received` | 받은 칭찬 목록 (공개 전 익명) | Auth |
| `/change-password` | 비밀번호 변경 | Auth |
| `/reveal/{sprintId}` | 스프린트 공개 결과 — 관계도 + 칭찬 | Auth + REVEALED |
| `/admin/sprints` | 스프린트 관리 (생성/공개/삭제) | Leader/Admin |
| `/admin/teams` | 팀 및 멤버 관리, Slack 연동 | Leader/Admin |
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
- [x] 칭찬 작성 (10~500자, 카테고리 태그)
- [x] 받은 칭찬 / 보낸 칭찬 목록
- [x] 스프린트 공개 + 커스텀 SVG 관계도 시각화
- [x] 공개 화면 축하 이벤트 (Confetti + 음향 + TTS)

### 완료 (Phase 2 — 알림)
- [x] Slack DM 알림 (칭찬 수신 시)
- [x] Slack 채널 알림 (스프린트 공개 시)
- [x] 관리자 패널에서 Slack 유저 연동

### 미구현 (Phase 3 — 개선)
- [ ] 공개 화면 통계 카드 UI (API는 구현됨, 화면 미표시)
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
vercel env add SLACK_WEBHOOK_URL

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

# Slack (선택)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...  # 채널 알림
SLACK_BOT_TOKEN=xoxb-...                                # DM 알림
NEXT_PUBLIC_SLACK_INVITE_URL=                           # Slack 워크스페이스 초대 링크
```
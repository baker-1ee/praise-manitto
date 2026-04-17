# PRD: 칭찬 마니또 서비스

## 1. 개요

### 1.1 서비스 소개
팀원들이 2주 스프린트 단위로 무작위 마니또를 배정받아 상대방을 익명으로 칭찬하고, 스프린트 종료 시 전체 공개를 통해 팀 문화를 활성화하는 웹 서비스.

### 1.2 목표
- 팀원 간 긍정적 관계 형성 및 심리적 안전감 제공
- 2주마다 반복되는 칭찬 루프로 팀 문화 정착
- 회고 시간에 재미있는 공개 이벤트로 팀 에너지 고조

### 1.3 대상 사용자
- **일반 사용자**: 개발팀 팀원 (현재 16명)
- **관리자**: 팀장 (스프린트 관리 및 전체 공개 권한)

---

## 2. 기술 스택 (Claude Code 구현 기준)

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI 컴포넌트 | shadcn/ui + Tailwind CSS |
| Backend | Next.js API Routes (또는 별도 NestJS) |
| DB | PostgreSQL (Prisma ORM) |
| 인증 | NextAuth.js (이메일/비밀번호 또는 Google OAuth) |
| 알림 | Slack Incoming Webhook |
| 배포 | Vercel (Frontend + API) ← **확정** |
| DB/Auth 호스팅 | Supabase (PostgreSQL) ← **확정** |

---

## 3. 핵심 기능 명세

### 3.1 사용자 인증

#### 요구사항
- 이메일 + 비밀번호 로그인
- 팀원은 관리자가 사전 등록 (초대 이메일 발송)
- 세션 기반 인증 (NextAuth.js)

#### 화면
- `/login` — 로그인 페이지
- `/register?token={초대토큰}` — 초대 링크로만 가입 가능

---

### 3.2 스프린트 관리 (관리자 전용)

#### 요구사항
- 관리자는 새 스프린트를 생성할 수 있다
  - 스프린트 이름 (예: "2024 Sprint 3")
  - 시작일 / 종료일 설정
- 스프린트 생성 시 **마니또 자동 배정** 트리거
- 한 번에 하나의 **활성 스프린트**만 존재
- 스프린트 상태: `PENDING` → `ACTIVE` → `REVEALED` → `CLOSED`

#### 마니또 배정 알고리즘
```
입력: 팀원 N명 (현재 16명)
조건: 자기 자신에게 배정 불가, 1:1 단방향 (A→B이면 B→A 가능)
방법: Fisher-Yates 셔플 후 순환 배정 또는 완전 랜덤 재시도
출력: { userId: string, manitoTargetId: string }[] (N개)
```

#### 화면
- `/admin/sprints` — 스프린트 목록 및 생성
- `/admin/sprints/{id}` — 스프린트 상세 (배정 현황, 칭찬 현황)

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
- `/praise/history` — 내가 작성한 칭찬 목록 (발신 내역)

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

#### Slack 알림 (1차 구현)
- Slack Incoming Webhook 사용
- 발송 내용:
  ```
  💌 익명의 팀원이 칭찬을 보냈어요!
  
  [태그: 기술력, 협업]
  "오늘 코드 리뷰에서 정말 꼼꼼하게 봐줘서 감사했어요!"
  
  👉 칭찬 확인하기: {서비스 URL}
  ```
- 각 팀원의 Slack User ID를 프로필에 등록 → DM 발송

#### 구현 방식
- Next.js API Route `/api/notifications/send`
- 칭찬 저장 시 비동기 알림 발송 (큐 없이 직접 호출, MVP)

---

### 3.7 스프린트 공개 (관리자 전용)

#### 요구사항
- 관리자가 "스프린트 공개" 버튼 클릭 시 스프린트 상태 → `REVEALED`
- 공개 이후 모든 팀원이 전체 마니또 관계도 + 칭찬 내역 조회 가능
- 공개 시 전체 팀 Slack 채널에 공개 알림 발송

#### 공개 알림 (Slack)
```
🎉 이번 스프린트 칭찬 마니또가 공개되었습니다!
👉 지금 확인하기: {서비스 URL}/reveal/{sprintId}
```

#### 화면
- `/reveal/{sprintId}` — 스프린트 공개 화면 (상세 3.8)

---

### 3.8 공개 결과 화면 (하이라이트 기능)

#### 요구사항
- 팀원들의 마니또 관계를 **화살표 다이어그램**으로 시각화
- 각 연결선(화살표) 클릭 시 해당 칭찬 내역 패널 표시
- 칭찬 많이 한 사람 / 많이 받은 사람 TOP 3 배지
- 애니메이션 연출 (순차적 화살표 등장 등)

#### UI 구성
```
[상단] 스프린트 이름 + 기간

[중앙] 관계도 (Force-directed graph 또는 원형 배치)
  - 팀원 아바타 원형 배치
  - 화살표: A → B (A가 B의 마니또)
  - 화살표에 칭찬 개수 배지
  - 클릭 시 사이드 패널에 칭찬 내용 리스트

[하단] 통계 카드 (shadcn Card 컴포넌트)
  - 칭찬왕 (가장 많이 칭찬한 사람)
  - 인기왕 (가장 많이 받은 사람)
  - 총 칭찬 수
  - 가장 많이 선택된 카테고리
```

#### 시각화 라이브러리
- `react-flow` 또는 `d3.js` — 관계도 렌더링
- shadcn `Card`, `Badge`, `Sheet` (사이드 패널) 컴포넌트 활용

---

## 4. 데이터 모델

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  avatarUrl     String?
  bio           String?
  slackUserId   String?
  role          Role     @default(MEMBER)
  createdAt     DateTime @default(now())

  manitoOf      ManitoPair[] @relation("Manito")
  manitoTarget  ManitoPair[] @relation("Target")
  sentPraises   Praise[]     @relation("Sender")
  receivedPraises Praise[]   @relation("Receiver")
}

enum Role {
  ADMIN
  MEMBER
}

model Sprint {
  id          String       @id @default(cuid())
  name        String
  startDate   DateTime
  endDate     DateTime
  status      SprintStatus @default(PENDING)
  createdAt   DateTime     @default(now())

  pairs       ManitoPair[]
  praises     Praise[]
}

enum SprintStatus {
  PENDING
  ACTIVE
  REVEALED
  CLOSED
}

model ManitoPair {
  id        String  @id @default(cuid())
  sprintId  String
  manitoId  String   // 칭찬해주는 사람
  targetId  String   // 칭찬받는 사람

  sprint    Sprint  @relation(fields: [sprintId], references: [id])
  manito    User    @relation("Manito", fields: [manitoId], references: [id])
  target    User    @relation("Target", fields: [targetId], references: [id])

  @@unique([sprintId, manitoId])
  @@unique([sprintId, targetId])
}

model Praise {
  id         String   @id @default(cuid())
  sprintId   String
  fromUserId String
  toUserId   String
  content    String
  categories String[]
  createdAt  DateTime @default(now())

  sprint     Sprint   @relation(fields: [sprintId], references: [id])
  sender     User     @relation("Sender", fields: [fromUserId], references: [id])
  receiver   User     @relation("Receiver", fields: [toUserId], references: [id])
}
```

---

## 5. API 엔드포인트

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/auth/login` | 로그인 | Public |
| POST | `/api/auth/register` | 회원가입 (초대 토큰) | Public |
| GET | `/api/sprints/active` | 현재 활성 스프린트 조회 | Auth |
| GET | `/api/sprints/{id}/my-manito` | 내 마니또 대상 조회 | Auth |
| POST | `/api/praises` | 칭찬 작성 | Auth |
| GET | `/api/praises/received` | 받은 칭찬 목록 | Auth |
| GET | `/api/praises/sent` | 보낸 칭찬 목록 | Auth |
| POST | `/api/admin/sprints` | 스프린트 생성 + 마니또 배정 | Admin |
| PUT | `/api/admin/sprints/{id}/reveal` | 스프린트 공개 | Admin |
| GET | `/api/sprints/{id}/reveal` | 공개된 스프린트 전체 조회 | Auth (REVEALED 상태만) |

---

## 6. 화면 목록 (Page Routes)

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/login` | 로그인 | Public |
| `/register` | 회원가입 (초대 토큰 필요) | Public |
| `/` | 홈 (내 마니또 + 현재 스프린트) | Auth |
| `/praise/write` | 칭찬 작성 | Auth |
| `/praise/history` | 내가 보낸 칭찬 | Auth |
| `/praises/received` | 받은 칭찬 | Auth |
| `/reveal/{sprintId}` | 스프린트 공개 결과 | Auth |
| `/admin/sprints` | 스프린트 관리 | Admin |
| `/admin/users` | 팀원 관리 | Admin |

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

## 8. 개발 우선순위 (MVP 범위)

### Phase 1 — 핵심 기능 (MVP)
1. 인증 (로그인/회원가입)
2. 관리자 스프린트 생성 + 마니또 자동 배정
3. 내 마니또 확인 화면
4. 칭찬 작성 + DB 저장
5. 받은 칭찬 목록
6. 스프린트 공개 + 관계도 시각화

### Phase 2 — 알림
7. Slack DM 알림 연동
8. 공개 시 Slack 채널 알림

### Phase 3 — 개선
10. 칭찬 통계 대시보드
11. 스프린트 아카이브 (지난 스프린트 히스토리)
12. 팀원 초대 이메일 자동 발송

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


## 10. Claude Code 구현 지시사항

이 PRD를 기반으로 아래 순서로 구현해주세요:

1. **프로젝트 초기화**: `create-next-app` + TypeScript + Tailwind + shadcn/ui 설정
2. **DB 스키마**: Prisma 스키마 작성 + 마이그레이션
3. **인증**: NextAuth.js 설정 (Credentials Provider)
4. **마니또 배정 로직**: Fisher-Yates 기반 배정 알고리즘
5. **API Routes**: 위 명세 순서대로 구현
6. **UI 페이지**: 홈 → 칭찬 작성 → 받은 칭찬 → 공개 화면 순
7. **관계도 시각화**: react-flow 또는 d3.js 활용
8. **Slack 알림**: Incoming Webhook 연동
9. **관리자 페이지**: 스프린트 관리 + 공개 기능

shadcn/ui 컴포넌트를 최대한 활용하고, 공개 화면의 관계도는 애니메이션 효과를 포함해 회고 시간에 보여주기 좋게 만들어주세요.
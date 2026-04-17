# 칭찬 마니또

팀원들이 2주 스프린트 단위로 무작위 마니또를 배정받아 익명으로 칭찬하는 서비스입니다.

## 기술 스택

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **DB**: Supabase (PostgreSQL) + Prisma ORM
- **Auth**: NextAuth.js (Credentials Provider)
- **알림**: Slack Incoming Webhook
- **배포**: Vercel

---

## 로컬 개발 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd praise-manitto
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 아래 값들을 채웁니다:

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Supabase Transaction Pooler URL (포트 6543) |
| `DIRECT_URL` | Supabase Direct Connection URL (포트 5432) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 으로 생성 |
| `NEXTAUTH_URL` | 로컬: `http://localhost:3000` |
| `SLACK_WEBHOOK_URL` | Slack Webhook URL (선택) |

### 3. DB 마이그레이션 실행

```bash
npx prisma migrate dev --name init
```

### 4. 초기 데이터 시딩 (선택)

```bash
npm run db:seed
```

시드 계정:
- 관리자: `admin@example.com` / `admin123!`
- 테스트 팀원: `minjun@example.com` / `member123!` (외 3명)

### 5. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인

---

## Supabase 설정 가이드

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 에서 계정 생성
2. "New project" → 이름, 비밀번호, 리전(Seoul) 설정
3. 프로젝트 생성 완료까지 약 2분 대기

### 2. 연결 URL 가져오기

Supabase Dashboard → **Project Settings** → **Database** → **Connection string**

- **Transaction pooler** (포트 6543) → `DATABASE_URL`에 입력
- **Direct connection** (포트 5432) → `DIRECT_URL`에 입력

> URL 형식: `postgresql://postgres.[ref]:[password]@...pooler.supabase.com:[port]/postgres`

### 3. 마이그레이션 실행 (DB 테이블 생성)

```bash
# 로컬에서 실행 (DIRECT_URL 사용)
npx prisma migrate deploy
```

생성되는 테이블:
- `User`, `Account`, `Session`, `VerificationToken` (NextAuth)
- `Sprint`, `ManitoPair`, `Praise` (서비스)

### 4. Prisma Studio로 DB 확인

```bash
npm run db:studio
```

---

## Vercel 배포 가이드

### 1. Vercel에 배포

```bash
npm i -g vercel
vercel link
vercel --prod
```

### 2. 환경변수 등록

Vercel Dashboard → 프로젝트 → **Settings** → **Environment Variables** 에서 아래 항목 추가:

| 변수 | 값 |
|------|-----|
| `DATABASE_URL` | Supabase Transaction Pooler (6543) |
| `DIRECT_URL` | Supabase Direct (5432) |
| `NEXTAUTH_SECRET` | 랜덤 시크릿 (prod용으로 새로 생성) |
| `NEXTAUTH_URL` | `https://your-domain.com` |
| `SLACK_WEBHOOK_URL` | Slack Webhook URL |

### 3. 커스텀 도메인 연결

1. Vercel Dashboard → 프로젝트 → **Settings** → **Domains**
2. 도메인 추가
3. Cloudflare DNS에 CNAME 레코드 추가 (Vercel 안내값)

---

## Slack 알림 설정

1. [api.slack.com/apps](https://api.slack.com/apps) → Create New App
2. **Incoming Webhooks** 활성화
3. 워크스페이스 추가 → Webhook URL 복사 → `SLACK_WEBHOOK_URL`에 입력
4. 팀원 개인 DM 알림: 각 팀원의 Slack User ID를 프로필에 등록 (관리자 → 팀원 관리 페이지)

---

## 주요 페이지

| 경로 | 설명 | 권한 |
|------|------|------|
| `/login` | 로그인 | Public |
| `/` | 홈 (내 마니또 확인) | Auth |
| `/praise/write` | 칭찬 작성 | Auth |
| `/praises/received` | 받은 칭찬 목록 | Auth |
| `/reveal/{id}` | 스프린트 공개 결과 | Auth |
| `/admin/sprints` | 스프린트 관리 | Admin |
| `/admin/users` | 팀원 관리 | Admin |

---

## 스프린트 운영 순서

1. **관리자** `/admin/sprints` → "새 스프린트" 생성 → 마니또 자동 배정
2. **팀원** 로그인 → 홈에서 마니또 카드 클릭으로 대상 확인
3. **2주 동안** `/praise/write` 에서 칭찬 작성 (대상에게 Slack 알림 발송)
4. **스프린트 마지막 날** 관리자가 "공개하기" 버튼 클릭
5. **전체 팀원** `/reveal/{id}` 에서 마니또 관계도 + 칭찬 내역 확인

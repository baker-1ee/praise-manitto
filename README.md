# 칭찬 마니또

팀원들이 2주 스프린트 단위로 무작위 마니또를 배정받아 익명으로 칭찬하는 서비스입니다.

## 기술 스택

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **DB**: Supabase (PostgreSQL) + Prisma ORM
- **Auth**: NextAuth.js (Credentials Provider)
- **알림**: 이메일 (Nodemailer) + Gmail API (이메일 회신으로 칭찬 작성/수집)
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
| `EMAIL_HOST` 등 | 이메일 알림용 SMTP 계정 (선택, 미설정 시 알림 없이 동작) |
| `GMAIL_*` | 이메일 회신 칭찬 수집용 Gmail API 연동 (선택) |
| `CRON_SECRET` | Vercel Cron 인증용 시크릿 (선택) |

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
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_SECURE` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | 이메일 알림용 SMTP 계정 (선택) |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REDIRECT_URI` / `GMAIL_REFRESH_TOKEN` / `GMAIL_PUBSUB_TOPIC` | 이메일 회신 칭찬 수집용 Gmail 연동 (선택) |
| `CRON_SECRET` | Vercel Cron Job 인증용 시크릿 (선택) |

### 3. 커스텀 도메인 연결

1. Vercel Dashboard → 프로젝트 → **Settings** → **Domains**
2. 도메인 추가
3. Cloudflare DNS에 CNAME 레코드 추가 (Vercel 안내값)

---

## 이메일 / Gmail 연동 설정 (선택)

### 1. 이메일 알림 (SMTP)

칭찬 수신·공개·독려 메일을 보내려면 `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` 등을 설정합니다.
미설정 시 알림 없이 정상 동작합니다(`lib/email.ts`가 자동으로 no-op 처리).

### 2. Gmail 회신으로 칭찬 작성/수집

팀원이 앱에 접속하지 않고 메일 회신만으로 칭찬을 남길 수 있게 하는 기능입니다.

1. Google Cloud Console에서 OAuth2 클라이언트 생성 후 [OAuth Playground](https://developers.google.com/oauthplayground)에서 `GMAIL_REFRESH_TOKEN` 발급 (`gmail.modify` 스코프)
2. Pub/Sub 토픽 생성 후 `GMAIL_PUBSUB_TOPIC`에 입력, `/api/email/inbound`를 push 구독 엔드포인트로 등록
3. `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `GMAIL_REFRESH_TOKEN`, `GMAIL_PUBSUB_TOPIC` 환경변수 등록
4. `vercel.json`의 `cron/watch-renew`가 6시간마다 Gmail watch를 갱신 (watch는 7일 후 만료)
5. 멤버의 `email`이 등록되어 있어야 발신자를 식별할 수 있음 (`/admin/teams`, `/admin/users`에서 설정)

---

## 주요 페이지

| 경로 | 설명 | 권한 |
|------|------|------|
| `/login` | 로그인 | Public |
| `/` | 홈 (내 마니또 확인) | Auth |
| `/praise/write` | 칭찬 작성 | Auth |
| `/praises/sent` | 내가 보낸 칭찬 목록 | Auth |
| `/praises/received` | 받은 칭찬 목록 | Auth |
| `/sprints` | 스프린트 목록 | Auth |
| `/reveal/{id}` | 스프린트 공개 결과 | Public |
| `/admin/sprints` | 스프린트 관리 | Leader/Admin |
| `/admin/teams` | 팀/멤버 관리 | Leader/Admin |
| `/admin/users` | 전체 유저 관리 | Admin |

---

## 스프린트 운영 순서

1. **관리자** `/admin/sprints` → "새 스프린트" 생성 → 마니또 자동 배정 (배정 시 이메일 안내 발송)
2. **팀원** 로그인 → 홈에서 마니또 카드 클릭으로 대상 확인
3. **2주 동안** `/praise/write` 에서 칭찬 작성 (또는 독려 메일에 회신만 해도 칭찬 작성됨) — 대상에게 이메일 알림 발송
4. **스프린트 마지막 날** 관리자가 "공개하기" 버튼 클릭 (공개 알림 이메일 발송)
5. **전체 팀원** `/reveal/{id}` 에서 마니또 관계도 + 칭찬 내역 확인

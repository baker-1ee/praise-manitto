# 코딩 컨벤션

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일 (컴포넌트) | kebab-case | `praise-form.tsx` |
| 파일 (라이브러리) | kebab-case | `manito.ts` |
| React 컴포넌트 | PascalCase | `PraiseForm` |
| 함수·변수 | camelCase | `assignManito()` |
| Prisma 모델 | PascalCase | `ManitoPair` |
| Zod 스키마 | camelCase + `Schema` suffix | `praiseSchema` |
| 환경변수 | UPPER_SNAKE_CASE | `NEXTAUTH_SECRET` |

## 파일 배치

- 재사용 컴포넌트 → `src/components/`
- shadcn/ui 원시 컴포넌트 → `src/components/ui/` (직접 수정 최소화)
- 비즈니스 로직·유틸 → `src/lib/`
- API 라우트 → `src/app/api/`
- 페이지 → `src/app/(dashboard)/` 또는 `src/app/admin/`

## API 라우트 필수 패턴

```ts
// 1. 인증 확인
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 2. 권한 확인 (역할 필요 시)
if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// 3. 입력 검증
const parsed = schema.safeParse(await req.json());
if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

// 4. Prisma 쿼리
const result = await prisma.someModel.create({ data: parsed.data });
return NextResponse.json(result);
```

## 컴포넌트 패턴

- 데이터 fetch → **Server Component** (기본)
- 인터랙션(form, 클릭 등) → `'use client'` 추가
- form 상태 → `react-hook-form` + Zod resolver 사용
- 토스트 피드백 → `useToast()` 훅 사용
- 로딩 상태 → `isSubmitting` 플래그 + 버튼 `disabled`

## 금지 패턴

- `prisma.$queryRaw` / `prisma.$executeRaw` — Raw SQL 금지
- `any` 타입 사용 금지 — Zod `z.infer<>` 또는 명시적 타입 사용
- `console.log` 남기기 금지 — 디버깅 후 반드시 제거
- 전역 상태 라이브러리 신규 도입 금지
- shadcn/ui 컴포넌트 직접 수정 금지 — 래퍼 컴포넌트 생성
- 민감 정보(비밀번호, 토큰) 클라이언트 응답에 포함 금지

## 에러 응답 형식

```ts
// 항상 이 형태로 통일
return NextResponse.json({ error: "설명 문자열" }, { status: 4xx });
```

## 이메일 알림 규칙

- 이메일 발송 실패가 메인 로직을 중단하면 안 된다.
- `lib/email.ts`의 발송 함수는 `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS` 미설정 시 조용히 no-op 처리된다 (선택적 기능).
- Gmail 수신 웹훅(`/api/email/inbound`)은 항상 `{ ok: true }`를 반환한다 — Pub/Sub 재시도 폭주를 막기 위해 내부 에러를 노출하지 않고 `console.error`로만 기록.

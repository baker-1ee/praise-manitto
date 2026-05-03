# 모드: Code (구현)

## 역할

기능 구현, 버그 수정, 리팩토링 실행.

## 작업 전 체크리스트

- [ ] `memory/activeContext.md` 에서 현재 작업 컨텍스트 확인
- [ ] `docs/ai/conventions.md` 의 금지 패턴 확인
- [ ] 변경할 파일의 연관 모듈 파악 (`docs/ai/architecture.md` 참조)

## 구현 원칙

**API 라우트 작성 순서:**
1. `getServerSession()` 인증 확인
2. 역할·팀 권한 확인
3. Zod `safeParse()` 입력 검증
4. Prisma 쿼리 (필요 시 `$transaction`)
5. 성공/에러 응답 반환

**컴포넌트 작성 기준:**
- 데이터가 필요하면 Server Component 우선 검토
- 이벤트 핸들러가 있으면 `'use client'` 추가
- form은 `react-hook-form` + Zod resolver 패턴 사용
- 로딩/에러 상태 처리 누락 금지

**타입 안전성:**
- `any` 금지, Zod `z.infer<typeof schema>` 또는 명시적 타입
- NextAuth 세션 타입은 `src/types/next-auth.d.ts` 기준 사용

**Slack 알림 추가 시:**
```ts
try {
  await sendSomeSlackNotification(...);
} catch (e) {
  console.error("Slack notification failed:", e);
  // 메인 로직은 계속 진행
}
```

## 작업 완료 후

`memory/progress.md` 를 업데이트한다:
- 완료 항목에 날짜와 함께 체크
- 새로 발견된 TODO 추가
- `memory/activeContext.md` 의 현재 작업 내용 갱신

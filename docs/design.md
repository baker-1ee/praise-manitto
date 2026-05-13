# Design System — 칭찬 마니또

Passionfroot 레퍼런스를 기반으로 한 "Cozy Editorial" 디자인 시스템.
따뜻한 크림 베이지 배경 + 코랄 오렌지 강조색 + Serif 헤딩 조합.

---

## 색상 팔레트

| 역할 | CSS 변수 | HEX | HSL |
|------|---------|-----|-----|
| 배경 | `--background` | `#F0EBE1` | `34 38% 89%` |
| 카드 배경 | `--card` | `#FAF8F4` | `38 40% 97%` |
| 텍스트 (메인) | `--foreground` | `#1C1A17` | `34 8% 10%` |
| 텍스트 (보조) | `--muted-foreground` | `#6B6560` | `22 5% 40%` |
| Primary (CTA) | `--primary` | `#E87845` | `18 78% 60%` |
| Primary hover | — | `#D4623A` | `18 68% 52%` |
| Secondary | `--secondary` | `#EDE8E0` | `34 22% 90%` |
| Muted | `--muted` | `#EAE5DB` | `34 22% 88%` |
| Border (일반) | `--border` | `rgba(28,26,23,0.12)` | — |
| Border (카드) | — | `rgba(28,26,23,0.18)` | — |
| Input border | `--input` | `rgba(28,26,23,0.2)` | — |
| Ring (focus) | `--ring` | `#E87845` | `18 78% 60%` |

### 기능 색상

| 용도 | 색상 |
|------|------|
| 위험/삭제 | `hsl(0 84% 60%)` |
| 성공 | `#4CAF50` |
| 경고 | `#E87845` (Primary와 동일) |
| 편지 배경 | `#FFFDF8` |
| 편지 선 | `rgba(180,155,100,0.22)` |
| 편지 점선 | `#D4C9A8` |

---

## 타이포그래피

### 폰트

| 역할 | 패밀리 | CSS 변수 |
|------|--------|---------|
| 헤딩 | Fraunces (Serif) | `--font-serif` |
| 본문 | Inter (Sans-serif) | `--font-sans` |
| 편지 | Georgia, serif | hardcoded |

### 크기 계층

| 클래스 | 사용처 |
|--------|--------|
| `font-serif text-3xl font-bold` | 페이지 타이틀 |
| `font-serif text-2xl font-bold` | 섹션 헤딩 |
| `font-serif text-xl font-bold` | 카드 타이틀 |
| `text-base font-semibold` | 서브헤딩 |
| `text-sm` | 본문 |
| `text-xs` | 메타/라벨 |

### 자간

| 이름 | 값 | 용도 |
|------|-----|------|
| `tracking-display` | `-2.125px` | 대형 헤딩 |
| `tracking-heading-lg` | `-1.5px` | 페이지 타이틀 |
| `tracking-heading` | `-0.625px` | 섹션 헤딩 |
| `tracking-subheading` | `-0.25px` | 카드 타이틀 |

---

## 컴포넌트 스타일

### 버튼

| 변형 | 스타일 |
|------|--------|
| `default` | 코랄 배경 (`#E87845`), 흰 텍스트, 둥근 모서리 |
| `outline` | 다크 보더 (`rgba(28,26,23,0.2)`), 투명 배경 |
| `secondary` | 크림 배경, 다크 텍스트 |
| `ghost` | 호버 시만 배경 |

모든 버튼: `rounded-xl` (16px), `font-semibold`, `active:scale-95`

### 카드

- 배경: `#FAF8F4`
- 보더: `1px solid rgba(28,26,23,0.15)` (기본) / `1.5px solid rgba(28,26,23,0.2)` (강조)
- 보더 반경: `1rem` (16px)
- 그림자: 없음 (flat) 또는 아주 미세한 elevation

### 배지

| 변형 | 스타일 |
|------|--------|
| `default` | 코랄 연한 배경 `#FEF0EA`, 코랄 텍스트 `#E87845` |
| `secondary` | 크림 배경, 브라운 텍스트 |
| `outline` | 투명, 다크 보더 |

### 인풋

- 배경: `#FAF8F4`
- 보더: `1px solid rgba(28,26,23,0.2)`
- 포커스 링: 코랄 (`#E87845`)
- 플레이스홀더: `#9C9590`

### 네비게이션

- 상단 바: `bg-background`, 하단 보더 `rgba(28,26,23,0.08)`
- 로고: `font-serif font-bold`
- 활성 링크: 코랄 텍스트 + 연한 코랄 배경 `rgba(232,120,69,0.08)`
- 비활성 링크: `#6B6560`

---

## 레이아웃

- 최대 너비: `max-w-4xl` (대시보드), `max-w-lg` (폼)
- 기본 패딩: `px-4 py-6`
- 섹션 간격: `space-y-6`
- 카드 내부 패딩: `p-5` 또는 `p-6`

---

## 아이콘

lucide-react 사용. 크기 기본값 `h-5 w-5`.
Primary 아이콘 색: `text-primary` (`#E87845`).
보조 아이콘 색: `text-muted-foreground` (`#6B6560`).

---

## 편지 스타일 (praise-form, praise-swipe-viewer)

기존의 손편지 UI를 유지하되 색상을 새 팔레트에 맞춤:
- 배경: `#FFFDF8` (매우 밝은 크림)
- 보더: `1px solid #D4C9A8`
- 점선 구분선: `1.5px dashed #D4C9A8`
- 노트 라인: `rgba(180,155,100,0.22)`
- 수신인 텍스트: `#2C2318`
- 라벨 (To./From.): `#9A8B6A`
- 본문 텍스트: `#2C2318`

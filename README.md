# 🎫 티켓을 JAVA라 — 프론트엔드

> **티켓을 JAVA라** 공연·스포츠 티켓 예매 플랫폼의 프론트엔드 프로젝트

스파르타 내일배움캠프 Spring 3기 · CH5 스프링 플러스 프로젝트 · **Team HOT6**

🔗 **배포 사이트**: [https://ticket-javara.site](https://ticket-javara.site/)

---

## 📌 프로젝트 소개

공연(콘서트, 뮤지컬, 전시)과 스포츠 티켓을 온라인으로 예매할 수 있는 플랫폼입니다.
좌석 임시 점유(Hold) → 결제 → 예매 확정 플로우를 지원하며, 실시간 CS 채팅과 선착순 쿠폰 발급 기능을 제공합니다.

### 핵심 기능

| 기능 | 설명 |
|------|------|
| 🎟 좌석 예매 | 좌석 선택 → 임시 점유(5분 TTL) → 결제 → 예매 확정 |
| 🔍 이벤트 검색 | 카테고리·정렬·상태 필터 + 인기 검색어 Top 10 |
| 🏷 쿠폰 | 선착순 쿠폰 발급 및 결제 시 적용 |
| 💬 CS 채팅 | WebSocket(STOMP + SockJS) 기반 실시간 고객↔관리자 채팅 |
| 👤 마이페이지 | 예매 내역 조회, 주문 취소, 쿠폰 관리, 프로필 수정 |
| ⚙️ 관리자 | 이벤트 등록/상태 변경, 쿠폰 등록/메트릭스, CS 대시보드 |

---

### 주요 화면

| 메인 페이지 | 이벤트 상세 | 좌석 선택 |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/4149bba5-313f-49cb-8ad4-d9792b8a924f" width="100%" alt="메인 페이지" /> | <img src="https://github.com/user-attachments/assets/2cfbbae0-8c97-47d4-907a-934a0b455e25" width="100%" alt="이벤트 상세" /> | <img src="https://github.com/user-attachments/assets/e0c7f913-8dca-4213-a64a-f5faf023e719" width="100%" alt="좌석 선택" /> |

| 주문 | 마이페이지 | 관리자 페이지 |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/a75528e2-cd02-46be-ad1d-3c436b2068c5" width="100%" height="320" alt="주문" /> | <img src="https://github.com/user-attachments/assets/40d35979-9932-4806-b378-47b319187d38" width="100%" height="320" alt="마이페이지" /> | <img src="https://github.com/user-attachments/assets/3f0b102c-9b35-483d-b62a-161251522f42" width="100%" height="320" alt="관리자 페이지" /> |

---

## 🛠 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| UI 라이브러리 | React | 18.3 |
| 언어 | TypeScript | 5.7 |
| 빌드 도구 | Vite | 6.0 |
| 라우팅 | react-router-dom | 6.28 |
| HTTP 클라이언트 | axios | 1.15.0 |
| 스타일링 | TailwindCSS | 3.4 |
| WebSocket | @stomp/stompjs + SockJS | 7.3 |

---

## 📁 폴더 구조

```
frontend/src/
├── api/            # API 호출 함수 (도메인별 분리)
│   ├── client.ts       # axios 인스턴스 (인터셉터, 토큰 자동 첨부)
│   ├── auth.ts         # 회원가입, 로그인
│   ├── events.ts       # 이벤트 목록/상세/검색/생성/상태변경
│   ├── seats.ts        # 좌석 조회, 선점(Hold), 해제
│   ├── orders.ts       # 주문 생성/조회/취소, 토스페이먼츠 승인
│   ├── coupons.ts      # 쿠폰 목록/발급/생성/메트릭스
│   ├── chat.ts         # 채팅방 생성/메시지 조회/관리자 채팅
│   ├── users.ts        # 프로필 조회/수정, 예매 내역, 쿠폰
│   └── search.ts       # 인기 검색어 조회/클릭
│
├── components/     # 재사용 공통 컴포넌트
│   ├── Button.tsx          # 버튼 (primary, secondary, danger, ghost)
│   ├── Input.tsx           # 입력 필드
│   ├── Header.tsx          # 상단 헤더 (네비게이션, 검색, 로그인 상태)
│   ├── Modal.tsx           # 모달 다이얼로그
│   ├── Toast.tsx           # 토스트 알림 (ToastProvider + useToast)
│   ├── LoadingSpinner.tsx  # 로딩 스피너
│   ├── EmptyState.tsx      # 빈 상태 안내
│   ├── SearchBar.tsx       # 검색 입력바
│   ├── Pagination.tsx      # 페이지네이션
│   ├── StatusBadge.tsx     # 상태 배지 (예매중, 매진, 종료됨 등)
│   ├── CountdownTimer.tsx  # 카운트다운 타이머
│   ├── SeatLegend.tsx      # 좌석 범례
│   ├── TicketSummaryCard.tsx # 티켓 요약 카드
│   ├── CarouselBanner.tsx  # 히어로 캐러셀 배너
│   └── ErrorBoundary.tsx   # 에러 바운더리
│
├── contexts/       # 전역 상태 (Context API)
│   └── AuthContext.tsx     # 인증 상태 (토큰, 유저 정보, 로그인/로그아웃)
│
├── hooks/          # 커스텀 훅
│   ├── useStompChat.ts     # 고객용 WebSocket 채팅 훅
│   └── useStompAdmin.ts    # 관리자용 WebSocket 채팅 훅
│
├── layouts/        # 레이아웃 컴포넌트
│   ├── MainLayout.tsx      # Header + Footer 기본 레이아웃
│   ├── AuthLayout.tsx      # 인증 전용 레이아웃 (Header 없음)
│   └── AdminLayout.tsx     # 관리자 전용 레이아웃
│
├── pages/          # 페이지 컴포넌트
│   ├── HomePage.tsx            # 메인 홈 (배너, 장르 랭킹, 이벤트 목록)
│   ├── LoginPage.tsx           # 로그인
│   ├── SignupPage.tsx          # 회원가입
│   ├── SearchResultPage.tsx    # 검색 결과 (v1/v2 캐시 비교)
│   ├── EventDetailPage.tsx     # 이벤트 상세
│   ├── TicketCategoryPage.tsx  # 카테고리별 이벤트 목록
│   ├── SeatSelectionPage.tsx   # 좌석 선택 (행별 좌석 배치도)
│   ├── OrderPaymentPage.tsx    # 주문/결제
│   ├── PaymentCompletePage.tsx # 결제 완료
│   ├── MyPage.tsx              # 마이페이지
│   ├── BookingListPage.tsx     # 예매 내역
│   ├── CouponListPage.tsx      # 내 쿠폰 목록
│   ├── CouponIssuePage.tsx     # 쿠폰 발급
│   ├── CouponEventPage.tsx     # 쿠폰 이벤트 페이지
│   ├── EditProfilePage.tsx     # 프로필 수정
│   ├── ChatPage.tsx            # 고객 CS 채팅
│   ├── AdminChatPage.tsx       # 관리자 CS 채팅
│   ├── ChatRouterPage.tsx      # 채팅 라우터 (역할별 분기)
│   ├── AdminPage.tsx           # 관리자 대시보드
│   ├── admin/
│   │   ├── AdminEventPage.tsx      # 관리자 이벤트 관리
│   │   ├── AdminCouponPage.tsx     # 관리자 쿠폰 관리
│   │   └── AdminCSDashboardPage.tsx # 관리자 CS 대시보드
│   └── NotFoundPage.tsx        # 404
│
├── routes/         # 라우팅 설정
│   ├── Router.tsx          # 전체 라우트 정의
│   ├── ProtectedRoute.tsx  # 인증 필요 라우트 가드
│   └── PublicOnlyRoute.tsx # 비로그인 전용 라우트 가드
│
├── types/          # TypeScript 타입 정의 (도메인별 분리)
│   ├── auth.ts     # 인증 (회원가입, 로그인)
│   ├── event.ts    # 이벤트 (목록, 상세, 상태, 생성)
│   ├── seat.ts     # 좌석 (상태, 선점)
│   ├── order.ts    # 주문 (생성, 상세, 취소, 토스페이먼츠)
│   ├── coupon.ts   # 쿠폰 (발급, 생성, 메트릭스)
│   ├── chat.ts     # 채팅 (채팅방, 메시지)
│   ├── user.ts     # 사용자 (프로필, 예매 내역)
│   ├── search.ts   # 검색 (인기 검색어)
│   └── common.ts   # 공통 (ApiError, PageResponse)
│
├── styles/
│   └── index.css   # TailwindCSS 글로벌 스타일
│
├── utils/
│   └── storage.ts  # localStorage 토큰 관리 유틸
│
├── App.tsx         # 앱 진입점
└── main.tsx        # React 렌더링 + Provider 설정
```

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 9 이상

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/6team-Plus-project-sparta/ticket-javara-frontend.git
cd ticket-javara-frontend/frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

개발 서버: http://localhost:5173

### 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 | `http://localhost:8080/api` |
| `VITE_WS_URL` | WebSocket 엔드포인트 | `http://localhost:8080/ws-stomp` |

> ⚠️ 배포 환경에서는 HTTPS 주소로 변경해야 합니다. HTTPS 페이지에서 HTTP WebSocket 연결은 브라우저가 차단합니다.

### 빌드

```bash
npm run build    # TypeScript 타입 체크 + Vite 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

---

## 🗺 라우팅 구조

### 공개 라우트 (누구나 접근 가능)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | HomePage | 메인 홈 (배너, 장르 랭킹, 이벤트 목록) |
| `/search` | SearchResultPage | 이벤트 검색 결과 |
| `/events/:eventId` | EventDetailPage | 이벤트 상세 정보 |
| `/coupons` | CouponEventPage | 쿠폰 이벤트 |
| `/ticket/:category?` | TicketCategoryPage | 카테고리별 이벤트 |

### 인증 필요 라우트 (로그인 필수)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/events/:eventId/seats` | SeatSelectionPage | 좌석 선택 |
| `/orders/payment` | OrderPaymentPage | 주문/결제 |
| `/orders/:orderId/complete` | PaymentCompletePage | 결제 완료 |
| `/mypage` | MyPage | 마이페이지 |
| `/mypage/bookings` | BookingListPage | 예매 내역 |
| `/mypage/coupons` | CouponListPage | 내 쿠폰 |
| `/mypage/edit` | EditProfilePage | 프로필 수정 |
| `/coupon/issue` | CouponIssuePage | 쿠폰 발급 |
| `/chat` | ChatRouterPage | CS 채팅 (역할별 자동 분기) |
| `/admin` | AdminPage | 관리자 대시보드 |

### 인증 전용 라우트 (비로그인 전용)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | LoginPage | 로그인 |
| `/signup` | SignupPage | 회원가입 |

### 관리자 전용 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/admin/events` | AdminEventPage | 이벤트 관리 |
| `/admin/coupons` | AdminCouponPage | 쿠폰 관리 |
| `/admin/chat` | AdminCSDashboardPage | CS 대시보드 |

---

## 🔌 API 연동 구조

### 공통 응답 래퍼

백엔드는 모든 API에서 공통 응답 래퍼를 사용합니다:

```json
{
  "data": { ... },
  "code": "200",
  "message": "OK"
}
```

각 API 모듈에서 `unwrap()` 헬퍼로 래퍼를 자동 처리하여 실제 데이터만 반환합니다.

### 인증 흐름

1. 로그인 시 `response.data.data.accessToken`에서 JWT 토큰 추출
2. `localStorage`에 토큰 저장
3. axios 요청 인터셉터에서 `Authorization: Bearer {token}` 자동 첨부
4. 401 응답 시 토큰 삭제 후 `/login`으로 리다이렉트 (로그인/회원가입 경로 제외)

### 페이지네이션 응답

```json
{
  "content": [...],
  "page": {
    "totalPages": 10,
    "totalElements": 95,
    "size": 10,
    "number": 0
  }
}
```

`page` 객체 안에 있는 값을 최상위로 매핑하여 사용합니다.

---

## 📡 주요 API 예시

### 인증

```ts
// 회원가입
const res = await signup({ email, password, nickname })

// 로그인
const res = await login({ email, password })
// → response.data.data.accessToken 에서 JWT 추출
```

### 이벤트

```ts
// 이벤트 목록 조회 (카테고리·상태·정렬·페이징)
const events = await getEvents({
  page: 0,
  size: 9,
  sort: 'createdAt,desc',
  category: 'CONCERT',    // CONCERT | MUSICAL | DISPLAY | SPORTS | ETC
  status: 'ON_SALE',      // ON_SALE | SOLD_OUT | ENDED | CANCELLED | DELETED
})

// 이벤트 상세 조회
const detail = await getEventDetail(eventId)

// 이벤트 검색 v1 (캐시 없음)
const result = await searchEventsV1({ keyword: '세븐틴', page: 0, size: 10 })

// 이벤트 검색 v2 (캐시 적용, X-Cache 헤더 포함)
const { data, cacheStatus } = await searchEventsV2({ keyword: '세븐틴' })
// cacheStatus: 'HIT' | 'MISS' | null
```

### 좌석 예매

```ts
// 좌석 목록 조회
const seatMap = await getSeats(eventId, sectionId)

// 좌석 선점 (5분 TTL)
const hold = await holdSeat(eventId, seatId)
// → { holdToken, seatId, seatNumber, expiresAt }

// 좌석 선점 해제
await releaseHold(eventId, seatId)

// 주문 생성 (선점된 좌석 + 쿠폰 적용)
const order = await createOrder({
  holdTokens: ['token1', 'token2'],
  userCouponId: 123,  // 선택
})

// 토스페이먼츠 결제 승인
const payment = await confirmTossPayment({
  paymentKey: 'toss_key',
  orderId: 1,
  amount: 110000,
  tossOrderId: 'toss_order_id',
})

// 주문 취소
await cancelOrder(orderId)
```

### 쿠폰

```ts
// 공개 쿠폰 목록 조회
const coupons = await getAllCoupons(0, 10)

// 쿠폰 발급 (선착순)
const issued = await issueCoupon(couponId)
// → { userCouponId, couponName, discountAmount, expiredAt }

// 내 쿠폰 목록
const myCoupons = await getMyCoupons()
```

### 채팅

```ts
// 채팅방 생성/조회 (고객)
const room = await createChatRoom()
// → { chatRoomId, status, createdAt }

// 메시지 조회 (커서 기반 페이징)
const messages = await getChatMessages(chatRoomId, { cursor: null, size: 20 })

// 관리자 채팅방 목록
const rooms = await getAdminChatRooms({ status: 'WAITING', page: 0, size: 10 })
```

### 관리자

```ts
// 이벤트 등록
const created = await createEvent({
  title: '세븐틴 콘서트 2026',
  category: 'CONCERT',
  venueId: 1,
  eventDate: '2026-06-15T19:00',
  saleStartAt: '2026-05-01T10:00',
  saleEndAt: '2026-06-15T18:00',
  sections: [{ sectionName: 'A구역', price: 110000, rowCount: 10, colCount: 20 }],
})

// 이벤트 상태 변경
await updateEventStatus(eventId, { status: 'SOLD_OUT' })
// 허용 전환: ON_SALE → SOLD_OUT, CANCELLED, DELETED
//           SOLD_OUT → ON_SALE, CANCELLED, DELETED
//           CANCELLED → DELETED
//           ENDED → DELETED

// 쿠폰 등록
const coupon = await createCoupon({
  name: '신규 가입 5,000원 할인',
  discountAmount: 5000,
  totalQuantity: 100,
  startAt: '2026-05-01T00:00',
  expiredAt: '2026-05-31T23:59',
})

// 쿠폰 메트릭스 조회
const metrics = await getCouponMetrics(couponId)
// → { totalAttempts, redisSuccess, dbFallback, successRate, fallbackRate }
```

---

## 🎨 디자인 시스템

### 브랜드 컬러

| 용도 | 색상 | 코드 |
|------|------|------|
| 메인 브랜드 | 🔴 레드 | `#FD002D` |
| CTA 버튼 | 🔴 딥 레드 | `#c43535` |
| 쿠폰 배너 | 🔴 쿠폰 레드 | `#eb3f3f` |
| 이벤트 상세 가격 | 🔴 버건디 | `#B4232C` |
| 보조 컬러 (더스티 핑크) | 🩷 | `#E8C7C9`, `#F2D7D9`, `#D9A8AE` |
| 본문 텍스트 (차콜) | ⚫ | `#2F2F33`, `#3A3A40`, `#4B5563` |

Tailwind 설정에서 기본 `blue`, `indigo` 팔레트를 `#FD002D` 계열로 교체하여 기존 `blue-600` 등의 클래스가 자동으로 브랜드 컬러를 적용합니다.

### 이벤트 상태

| 상태 | 라벨 | 설명 |
|------|------|------|
| `ON_SALE` | 예매중 | 예매 가능 |
| `SOLD_OUT` | 매진 | 잔여석 0 |
| `ENDED` | 종료됨 | 공연일 경과 (관리자만 조회 가능) |
| `CANCELLED` | 취소됨 | 이벤트 취소 |
| `DELETED` | 삭제됨 | 이벤트 삭제 |

---

## 💬 실시간 채팅

WebSocket 기반 실시간 CS 채팅을 지원합니다.

- **프로토콜**: STOMP over SockJS
- **라이브러리**: `@stomp/stompjs` + CDN SockJS (`window.SockJS`)
- **엔드포인트**: `/ws-stomp`
- **구독 경로**: `/sub/chat/{chatRoomId}`
- **발행 경로**: `/pub/chat/message`

### 채팅 흐름

1. 고객이 `/chat` 접속 → 채팅방 자동 생성/조회
2. STOMP 연결 → 메시지 구독
3. 메시지 전송 시 STOMP로 발행
4. 관리자는 CS 대시보드에서 대기/진행 중 채팅방 목록 확인 및 응답

> ⚠️ HTTPS 배포 환경에서는 백엔드도 SSL이 적용되어야 SockJS 연결이 가능합니다.

---

## 👥 팀 구성

| 이름 | 역할 |
|------|------|
| 정태규 | 백엔드 개발 |
| 강태훈 | 백엔드 개발 |
| 선경안 | 백엔드 개발 |
| 이지민 | 백엔드 개발 |
| 임하은 | 백엔드 개발 |

**Tutor**: 홍순구

---

## 📜 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (http://localhost:5173) |
| `npm run build` | TypeScript 타입 체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 코드 검사 |

---

## 📄 라이선스

이 프로젝트는 스파르타 내일배움캠프 교육 목적으로 제작되었습니다.

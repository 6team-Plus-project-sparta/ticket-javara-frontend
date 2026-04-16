/**
 * Router.tsx — 전체 라우팅 구조 정의
 *
 * 구조 설명:
 *
 * [MainLayout]  — Header + 본문 레이아웃
 *   ├── 공개 라우트 (누구나 접근 가능)
 *   │   ├── /              → HomePage
 *   │   ├── /search        → SearchResultPage
 *   │   ├── /events/:id    → EventDetailPage
 *   │
 *   └── [ProtectedRoute]  — 로그인 필요 (없으면 /login으로 이동)
 *       ├── /events/:id/seats  → SeatSelectionPage
 *       ├── /orders/payment    → OrderPaymentPage
 *       ├── /orders/:id/complete → PaymentCompletePage
 *       ├── /mypage            → MyPage
 *       ├── /mypage/bookings   → BookingListPage
 *       ├── /mypage/coupons    → CouponListPage
 *       ├── /mypage/edit       → EditProfilePage
 *       ├── /coupon/issue      → CouponIssuePage
 *       └── /chat              → ChatPage
 *
 * [AuthLayout]  — Header 없는 인증 전용 레이아웃
 *   └── [PublicOnlyRoute]  — 비로그인 전용 (로그인 상태면 /로 이동)
 *       ├── /login   → LoginPage
 *       └── /signup  → SignupPage
 *
 * [AdminLayout] — 관리자 전용 레이아웃
 *   └── [AdminRoute] — 관리자 권한 여부 확인
 *       ├── /admin/events    → AdminEventPage
 *       ├── /admin/coupons   → AdminCouponPage
 *       └── /admin/chat      → AdminCSDashboardPage
 *
 * *  → NotFoundPage
 */

import { Routes, Route } from 'react-router-dom'

import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'

import HomePage            from '@/pages/HomePage'
import SearchResultPage    from '@/pages/SearchResultPage'
import EventDetailPage     from '@/pages/EventDetailPage'
import SeatSelectionPage   from '@/pages/SeatSelectionPage'
import OrderPaymentPage    from '@/pages/OrderPaymentPage'
import PaymentCompletePage from '@/pages/PaymentCompletePage'
import MyPage              from '@/pages/MyPage'
import BookingListPage     from '@/pages/BookingListPage'
import CouponListPage      from '@/pages/CouponListPage'
import EditProfilePage     from '@/pages/EditProfilePage'
import CouponIssuePage     from '@/pages/CouponIssuePage'
import CouponEventPage     from '@/pages/CouponEventPage'
import ChatRouterPage      from '@/pages/ChatRouterPage'
import LoginPage           from '@/pages/LoginPage'
import SignupPage          from '@/pages/SignupPage'
import AdminPage           from '@/pages/AdminPage'
import NotFoundPage        from '@/pages/NotFoundPage'
import AdminLayout         from '@/layouts/AdminLayout'
import AdminRoute          from './AdminRoute'
import AdminEventPage      from '@/pages/admin/AdminEventPage'
import AdminCouponPage     from '@/pages/admin/AdminCouponPage'
import AdminCSDashboardPage from '@/pages/admin/AdminCSDashboardPage'

function Router() {
  return (
    <Routes>

      {/* ── Header가 있는 메인 레이아웃 ── */}
      <Route element={<MainLayout />}>

        {/* 공개 라우트 — 누구나 접근 가능 */}
        <Route path="/"             element={<HomePage />} />
        <Route path="/search"       element={<SearchResultPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/coupons"      element={<CouponEventPage />} />

        {/* 인증 필요 라우트 — 로그인 안 됐으면 /login으로 이동 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/events/:eventId/seats"    element={<SeatSelectionPage />} />
          <Route path="/orders/payment"           element={<OrderPaymentPage />} />
          <Route path="/orders/:orderId/complete" element={<PaymentCompletePage />} />
          <Route path="/mypage"                   element={<MyPage />} />
          <Route path="/mypage/bookings"          element={<BookingListPage />} />
          <Route path="/mypage/coupons"           element={<CouponListPage />} />
          <Route path="/mypage/edit"              element={<EditProfilePage />} />
          <Route path="/coupon/issue"             element={<CouponIssuePage />} />
          <Route path="/chat"                     element={<ChatRouterPage />} />
          <Route path="/admin"                    element={<AdminPage />} />
        </Route>

      </Route>

      {/* ── Header 없는 인증 전용 레이아웃 ── */}
      <Route element={<AuthLayout />}>

        {/* 비로그인 전용 — 이미 로그인했으면 /로 이동 */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

      </Route>

      {/* ── 관리자 전용 레이아웃 ── */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/events"  element={<AdminEventPage />} />
          <Route path="/admin/coupons" element={<AdminCouponPage />} />
          <Route path="/admin/chat"    element={<AdminCSDashboardPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  )
}

export default Router

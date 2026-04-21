// 주문 관련 API - 주문 생성, 조회, 취소, 토스페이먼츠 승인
import apiClient from './client'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetail,
  CancelOrderResponse,
  ConfirmTossPaymentRequest,
  ConfirmTossPaymentResponse,
} from '../types/order'

/** 백엔드 공통 응답 래퍼 */
interface ApiWrapper<T> {
  data: T
  code: string
  message: string
}

function unwrap<T>(data: ApiWrapper<T> | T): T {
  const d = data as ApiWrapper<T>
  return d?.data !== undefined ? d.data : (data as T)
}

// 주문 생성
export const createOrder = async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<ApiWrapper<CreateOrderResponse>>('/orders', data)
  return unwrap(response.data)
}

// 주문 상세 조회
export const getOrder = async (orderId: number): Promise<OrderDetail> => {
  const response = await apiClient.get<ApiWrapper<OrderDetail>>(`/orders/${orderId}`)
  const result = unwrap(response.data)
  console.log(`[getOrder] orderId=${orderId}:`, result)
  return result
}

// 주문 취소
export const cancelOrder = async (orderId: number): Promise<CancelOrderResponse> => {
  const response = await apiClient.post<ApiWrapper<CancelOrderResponse>>(`/orders/${orderId}/cancel`)
  return unwrap(response.data)
}

/**
 * 토스페이먼츠 결제 승인
 *
 * 토스 결제창에서 카드 결제 완료 후 successUrl로 리다이렉트될 때,
 * URL에 paymentKey / orderId / amount 가 쿼리 파라미터로 옵니다.
 * 이를 백엔드로 전달해 최종 승인을 처리합니다.
 *
 * 백엔드 엔드포인트: POST /api/orders/{orderId}/confirm-payment
 */
export const confirmTossPayment = async (
    data: ConfirmTossPaymentRequest
): Promise<ConfirmTossPaymentResponse> => {
  const response = await apiClient.post<ConfirmTossPaymentResponse>(
      `/orders/${data.orderId}/confirm-payment`,
      { paymentKey: data.paymentKey, amount: data.amount, tossOrderId: data.tossOrderId }
  )
  return response.data
}
// 주문 관련 API - 주문 생성, 조회, 취소
import apiClient from './client'
import type { CreateOrderRequest, CreateOrderResponse, OrderDetail, CancelOrderResponse } from '../types/order'

// 주문 생성
export const createOrder = async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>('/orders', data)
  return response.data
}

// 주문 상세 조회
export const getOrder = async (orderId: number): Promise<OrderDetail> => {
  const response = await apiClient.get<OrderDetail>(`/orders/${orderId}`)
  return response.data
}

// 주문 취소
export const cancelOrder = async (orderId: number): Promise<CancelOrderResponse> => {
  const response = await apiClient.post<CancelOrderResponse>(`/orders/${orderId}/cancel`)
  return response.data
}

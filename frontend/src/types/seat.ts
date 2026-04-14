// 좌석 관련 타입 정의 - 좌석 상태, 좌석 맵, 선점 응답

export type SeatStatus = 'AVAILABLE' | 'ON_HOLD' | 'CONFIRMED'

export interface Seat {
  seatId: number
  seatNumber: string
  row: string
  col: number
  status: SeatStatus
}

export interface SeatSection {
  sectionId: number
  sectionName: string
  price: number
  seats: Seat[]
}

export interface SeatMap {
  eventId: number
  sections: SeatSection[]
}

export interface HoldResponse {
  holdToken: string
  seatId: number
  seatNumber: string
  expiresAt: string
}

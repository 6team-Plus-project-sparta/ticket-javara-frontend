// 좌석 관련 타입 정의 - 좌석 상태, 좌석 맵, 선점 응답

export type SeatStatus = 'AVAILABLE' | 'ON_HOLD' | 'CONFIRMED'

export interface Seat {
  seatId: number
  seatNumber: string
  /** 행 이름 (백엔드: rowName) */
  rowName: string
  /** 열 번호 (백엔드: colNum) */
  colNum: number
  status: SeatStatus
  /** 프론트 호환용 — 없으면 rowName 사용 */
  row?: string
  /** 프론트 호환용 — 없으면 colNum 사용 */
  col?: number
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

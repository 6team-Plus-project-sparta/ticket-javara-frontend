---
inclusion: always
---

# 티켓 예매 서비스 프론트엔드 개발 규칙

## 프로젝트 개요
티켓 예매 서비스의 프론트엔드 프로젝트. 루트 경로 기준 `frontend/` 폴더 안에 위치한다.

## 기술 스택
- React 18 + TypeScript
- Vite
- react-router-dom
- axios
- TailwindCSS

## 폴더 구조
```
frontend/src/
├── pages/       # 페이지 단위 컴포넌트
├── components/  # 재사용 가능한 공통 컴포넌트
├── api/         # API 호출 함수 (도메인별 파일 분리)
├── hooks/       # 커스텀 훅
├── types/       # TypeScript 타입 정의 (도메인별 파일 분리)
└── styles/      # 글로벌 스타일
```

## 코딩 규칙
- 함수형 컴포넌트 + hooks만 사용 (클래스 컴포넌트 금지)
- 컴포넌트 파일명은 PascalCase (예: `TicketCard.tsx`)
- API 함수는 `src/api/`에 도메인별로 분리 (예: `auth.ts`, `ticket.ts`)
- 타입 정의는 `src/types/`에 도메인별로 분리 (예: `auth.ts`, `ticket.ts`)
- 전역 상태가 필요하면 Context API 사용
- 주석은 한국어로 작성
- CSS는 TailwindCSS 유틸리티 클래스 사용 (styled-components 사용 금지)

## 개발 서버 정보
- 백엔드: http://localhost:8080
- 프론트엔드: http://localhost:5173
- API prefix: `/api`
- axios baseURL: `http://localhost:8080/api`

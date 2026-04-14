/**
 * App.tsx — 앱의 진입점
 *
 * Router 컴포넌트만 렌더링한다.
 * Provider 설정(BrowserRouter, AuthProvider, ToastProvider)은 main.tsx에서 처리한다.
 */

import Router from './routes/Router'

function App() {
  return <Router />
}

export default App

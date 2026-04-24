// 배포 환경에서 임시로 사용할 수 있는 스크립트
// 브라우저 개발자 도구 콘솔에서 실행

// 현재 환경에 맞는 WebSocket URL 설정
window.TEMP_WS_URL = 'https://ticket-javara.site/ws-stomp';

// 또는 로컬스토리지에 저장
localStorage.setItem('TEMP_WS_URL', 'https://ticket-javara.site/ws-stomp');

console.log('임시 WebSocket URL 설정 완료:', window.TEMP_WS_URL);
function AdminEventPage() {
  return (
    <div className="flex bg-white shadow-sm border border-gray-100 rounded-xl flex-col items-center justify-center p-20 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 shrink-0 text-3xl">🪩</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">이벤트 관리 (추후 구현 예정)</h2>
      <p className="text-gray-500 text-sm max-w-md">
        이곳에서 새로운 공연, 콘서트, 연극 등 이벤트를 생성하고 관리할 수 있습니다. 
        API 명세서의 <code className="text-blue-500 bg-blue-50 px-1 py-0.5 rounded">POST /api/admin/events</code> 등과 연동됩니다.
      </p>
    </div>
  )
}

export default AdminEventPage

/**
 * SeatLegend 컴포넌트
 * - 좌석 선택 화면 하단에 표시하는 범례
 * - 선택 가능 / 내가 선택 / 임시 선점(다른 사람) / 예매 완료 4가지 상태 표시
 */

const legends = [
  { label: '선택 가능',    className: 'bg-white border-2 border-gray-300 rounded-t-lg rounded-b-sm' },
  { label: '내가 선택',    className: 'bg-blue-600 border-2 border-blue-600 rounded-t-lg rounded-b-sm' },
  { label: '임시 선점 중', className: 'bg-yellow-400 border-2 border-yellow-400 rounded-t-lg rounded-b-sm' },
  { label: '예매 완료',    className: 'bg-gray-400 border-2 border-gray-400 rounded-t-lg rounded-b-sm' },
]

function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-3">
      {legends.map(({ label, className }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={['h-5 w-5 rounded-sm', className].join(' ')} aria-hidden="true" />
          <span className="text-xs text-gray-600">{label}</span>
        </div>
      ))}
    </div>
  )
}

export default SeatLegend

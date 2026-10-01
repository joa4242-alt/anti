import React from 'react';
import type { BusTemplate, Seat } from '../types/bus';
import './BusLayout.css';

interface BusLayoutProps {
  template: BusTemplate;
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  // 추첨 결과 (좌석 ID → 학생 이름). 값이 있으면 결과 표시 모드로 좌석 선택이 잠깁니다.
  assignedNames?: Map<string, string>;
  // 추첨 연출 중인 좌석 (이름이 임시로 바뀌는 중)
  spinningSeatIds?: Set<string>;
  // 결과 화면에서 부분 재추첨/결석 처리용으로 고른 좌석
  pickedSeatIds?: Set<string>;
  onPickSeat?: (seatId: string) => void;
}

export const BusLayout: React.FC<BusLayoutProps> = ({
  template,
  selectedSeatIds,
  onToggleSeat,
  assignedNames,
  spinningSeatIds,
  pickedSeatIds,
  onPickSeat,
}) => {
  const isResultMode = assignedNames !== undefined;
  const selectedSet = new Set(selectedSeatIds);

  // (row y, col x) 위치 기준 좌석 Map 생성
  const seatMap = new Map<string, Seat>();
  template.seats.forEach((seat) => {
    seatMap.set(`${seat.y}-${seat.x}`, seat);
  });

  // 통로 열: 맨 뒷줄을 제외한 모든 행에 좌석이 없는 열
  const aisleCols = new Set(
    [0, 1, 2, 3, 4].filter((col) =>
      template.seats.every((seat) => seat.x !== col || seat.y === template.totalRows - 1)
    )
  );
  const firstAisleCol = Math.min(...aisleCols);

  const getColumnHeaderLabels = () =>
    [0, 1, 2, 3, 4].map((col) => {
      if (aisleCols.has(col)) return '통로';
      return col === 0 || col === 4 ? '창가' : '복도';
    });

  const isAisleCell = (rowIndex: number, colIndex: number) =>
    rowIndex !== template.totalRows - 1 && aisleCols.has(colIndex);

  const renderRow = (rowIndex: number) => {
    return (
      <div key={`row-${rowIndex}`} className="bus-row">
        {[0, 1, 2, 3, 4].map((colIndex) => {
          const seat = seatMap.get(`${rowIndex}-${colIndex}`);

          if (seat) {
            const isSelected = selectedSet.has(seat.id);

            if (isResultMode) {
              const studentName = assignedNames.get(seat.id);
              const isSpinning = spinningSeatIds?.has(seat.id) ?? false;
              const isPicked = pickedSeatIds?.has(seat.id) ?? false;
              // 배정된 좌석은 연출 중이 아닐 때 눌러서 고를 수 있다
              const canPick = !!studentName && !spinningSeatIds && !!onPickSeat;
              const className = `bus-seat-card result ${
                studentName ? (isSpinning ? 'spinning' : 'assigned') : 'unused'
              } ${isPicked ? 'picked' : ''} ${canPick ? 'pickable' : ''}`;
              const content = (
                <>
                  <div className="seat-headrest" />
                  {isPicked && <div className="seat-check-badge picked-badge">✓</div>}
                  <div className="seat-number">
                    {String(seat.number).padStart(2, '0')}
                  </div>
                  <div className="seat-student-name">{studentName ?? '-'}</div>
                </>
              );

              if (canPick) {
                return (
                  <button
                    key={seat.id}
                    type="button"
                    className={className}
                    onClick={() => onPickSeat(seat.id)}
                    aria-pressed={isPicked}
                    title={`좌석 ${seat.number}번: ${studentName} (${isPicked ? '고름 - 누르면 취소' : '누르면 고르기'})`}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div
                  key={seat.id}
                  className={className}
                  title={
                    studentName
                      ? `좌석 ${seat.number}번: ${studentName}`
                      : `좌석 ${seat.number}번 (비어 있음)`
                  }
                >
                  {content}
                </div>
              );
            }

            return (
              <button
                key={seat.id}
                type="button"
                className={`bus-seat-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleSeat(seat.id)}
                title={`좌석 ${seat.number}번 (${isSelected ? '선택됨 - 클릭 시 해제' : '미선택 - 클릭 시 선택'})`}
                aria-pressed={isSelected}
              >
                <div className="seat-headrest" />
                {isSelected && <div className="seat-check-badge">✓</div>}
                <div className="seat-number">
                  {String(seat.number).padStart(2, '0')}
                </div>
                <div className="seat-label">{isSelected ? '선택' : '석'}</div>
              </button>
            );
          }

          if (isAisleCell(rowIndex, colIndex)) {
            return (
              <div key={`aisle-${rowIndex}-${colIndex}`} className="bus-aisle-cell">
                {rowIndex === 0 && colIndex === firstAisleCol && (
                  <span className="aisle-label">통로</span>
                )}
              </div>
            );
          }

          return <div key={`empty-${rowIndex}-${colIndex}`} className="bus-empty-cell" />;
        })}
      </div>
    );
  };

  return (
    <div className="bus-container">
      {/* 버스 상단 지붕 & 앞쪽 안내 */}
      <div className="bus-header-banner">
        <span className="bus-direction-badge">앞 ⬆️ (운전석 / 출입문 방향)</span>
      </div>

      {/* 버스 차체 외형 */}
      <div className="bus-frame">
        {/* 버스 전면부 (운전석 & 출입문) */}
        <div className="bus-front-area">
          <div className="driver-seat" title="운전석">
            <span className="driver-icon">🛞</span>
            <span className="driver-text">운전석</span>
          </div>

          <div className="windshield-area">
            <span className="windshield-text">전면 유리</span>
          </div>

          <div className="door-area" title="출입문">
            <span className="door-icon">🚪</span>
            <span className="door-text">출입문</span>
          </div>
        </div>

        {/* 버스 내부 좌석 통로 배치 */}
        <div className="bus-interior">
          <div className="bus-column-header">
            {getColumnHeaderLabels().map((label, i) => (
              <span key={i} className={label === '통로' ? 'aisle-header-text' : ''}>
                {label}
              </span>
            ))}
          </div>

          <div className="bus-grid">
            {Array.from({ length: template.totalRows }).map((_, index) =>
              renderRow(index)
            )}
          </div>
        </div>

        {/* 버스 후면부 */}
        <div className="bus-rear-area">
          <span className="rear-text">뒤 ⬇️ (엔진 룸)</span>
        </div>
      </div>
    </div>
  );
};

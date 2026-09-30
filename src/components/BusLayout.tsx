import React from 'react';
import type { BusTemplate, Seat } from '../types/bus';
import './BusLayout.css';

interface BusLayoutProps {
  template: BusTemplate;
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
}

export const BusLayout: React.FC<BusLayoutProps> = ({
  template,
  selectedSeatIds,
  onToggleSeat,
}) => {
  const selectedSet = new Set(selectedSeatIds);

  // (row y, col x) 위치 기준 좌석 Map 생성
  const seatMap = new Map<string, Seat>();
  template.seats.forEach((seat) => {
    seatMap.set(`${seat.y}-${seat.x}`, seat);
  });

  const getColumnHeaderLabels = () => {
    if (template.id === 'bus-28') {
      return ['창가', '복도', '통로', '통로', '창가'];
    }
    if (template.id === 'bus-25') {
      return ['창가', '통로', '통로', '복도', '창가'];
    }
    return ['창가', '복도', '통로', '복도', '창가'];
  };

  const isAisleCell = (templateId: string, rowIndex: number, colIndex: number, totalRows: number) => {
    if (rowIndex === totalRows - 1) return false;

    if (templateId === 'bus-45') {
      return colIndex === 2;
    }
    if (templateId === 'bus-28') {
      return colIndex === 2 || colIndex === 3;
    }
    if (templateId === 'bus-25') {
      return colIndex === 1 || colIndex === 2;
    }
    return colIndex === 2;
  };

  const renderRow = (rowIndex: number) => {
    return (
      <div key={`row-${rowIndex}`} className="bus-row">
        {[0, 1, 2, 3, 4].map((colIndex) => {
          const seat = seatMap.get(`${rowIndex}-${colIndex}`);

          if (seat) {
            const isSelected = selectedSet.has(seat.id);

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

          if (isAisleCell(template.id, rowIndex, colIndex, template.totalRows)) {
            return (
              <div key={`aisle-${rowIndex}-${colIndex}`} className="bus-aisle-cell">
                {rowIndex === 0 && colIndex === (template.id === 'bus-25' ? 1 : 2) && (
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

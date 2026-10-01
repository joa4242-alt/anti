import React from 'react';
import type { BusTemplate, DrawSession } from '../types/bus';
import { formatDate, getResultRows, getSeatGrid } from '../utils/resultRows';
import './PrintSheet.css';

interface PrintSheetProps {
  template: BusTemplate;
  session: DrawSession;
}

/**
 * 인쇄 전용 배정표. 화면에서는 숨겨져 있고 인쇄할 때만 나타납니다.
 * 1쪽: 버스형 배치도 / 2쪽: 목록형 표
 */
export const PrintSheet: React.FC<PrintSheetProps> = ({ template, session }) => {
  const rows = getResultRows(template, session);
  const nameBySeat = new Map(rows.map((r) => [r.seatId, r.studentName]));
  const grid = getSeatGrid(template);
  // 목록은 두 단으로 나눠 한 쪽에 들어가게 한다 (45명까지)
  const half = Math.ceil(rows.length / 2);
  const listColumns = [rows.slice(0, half), rows.slice(half)].filter((c) => c.length > 0);
  const subtitle = `${formatDate(session.createdAt)} · 학생 ${rows.length}명`;

  return (
    <div className="print-sheet">
      <section className="print-page">
        <h1 className="print-title">🚌 {template.name} 자리 배정표</h1>
        <p className="print-subtitle">{subtitle}</p>

        <div className="print-bus-front">
          <span>🛞 운전석</span>
          <span>▲ 앞</span>
          <span>출입문 🚪</span>
        </div>

        <div className="print-bus-grid">
          {grid.map((row, rowIndex) =>
            row.map((seat, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              if (!seat) return <div key={key} className="print-cell empty" />;
              const name = nameBySeat.get(seat.id);
              return (
                <div key={key} className={`print-cell ${name ? 'assigned' : 'unused'}`}>
                  <span className="print-seat-number">
                    {String(seat.number).padStart(2, '0')}
                  </span>
                  <span className="print-seat-name">{name ?? ''}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="print-bus-rear">▼ 뒤</div>
      </section>

      <section className="print-page">
        <h1 className="print-title">📋 {template.name} 자리 배정 목록</h1>
        <p className="print-subtitle">{subtitle}</p>
        <div className="print-list-columns">
          {listColumns.map((column, i) => (
            <table key={i} className="print-list-table">
              <thead>
                <tr>
                  <th className="print-list-seat">좌석</th>
                  <th>학생</th>
                  <th className="print-list-position">위치</th>
                </tr>
              </thead>
              <tbody>
                {column.map((row) => (
                  <tr key={row.seatId}>
                    <td className="print-list-seat">
                      {String(row.seatNumber).padStart(2, '0')}
                    </td>
                    <td className="print-list-name">{row.studentName}</td>
                    <td className="print-list-position">{row.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </section>
    </div>
  );
};

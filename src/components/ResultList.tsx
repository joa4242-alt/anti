import React from 'react';
import type { BusTemplate, DrawSession } from '../types/bus';
import './ResultList.css';

interface ResultListProps {
  template: BusTemplate;
  session: DrawSession;
}

// 열 위치(x) → 자리 설명
const getSeatPosition = (template: BusTemplate, x: number, y: number) => {
  if (y === template.totalRows - 1) return '맨 뒷줄';
  return x === 0 || x === 4 ? '창가' : '복도';
};

/**
 * 교사용 목록형 결과표 (PRD 10장).
 * 좌석 번호 순으로 정렬하여 "좌석번호 | 학생" 형태로 보여 줍니다.
 */
export const ResultList: React.FC<ResultListProps> = ({ template, session }) => {
  const nameById = new Map(session.students.map((s) => [s.id, s.name]));
  const seatById = new Map(template.seats.map((s) => [s.id, s]));

  const rows = session.assignments
    .map((a) => {
      const seat = seatById.get(a.seatId);
      return {
        seatId: a.seatId,
        seatNumber: seat ? Number(seat.number) : 0,
        position: seat ? getSeatPosition(template, seat.x, seat.y) : '',
        studentName: nameById.get(a.studentId) ?? '',
      };
    })
    .sort((a, b) => a.seatNumber - b.seatNumber);

  return (
    <div className="result-list-container">
      <div className="result-list-header">
        <span className="section-icon">📋</span>
        <h2 className="result-list-title">
          {template.name} 자리 배정표
        </h2>
        <span className="result-list-count">{rows.length}명</span>
      </div>

      <table className="result-list-table">
        <thead>
          <tr>
            <th scope="col">좌석번호</th>
            <th scope="col">학생</th>
            <th scope="col">위치</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.seatId}>
              <td className="col-seat">{String(row.seatNumber).padStart(2, '0')}</td>
              <td className="col-name">{row.studentName}</td>
              <td className="col-position">{row.position}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

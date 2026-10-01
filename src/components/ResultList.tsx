import React from 'react';
import type { BusTemplate, DrawSession } from '../types/bus';
import { getResultRows } from '../utils/resultRows';
import './ResultList.css';

interface ResultListProps {
  template: BusTemplate;
  session: DrawSession;
}

/**
 * 교사용 목록형 결과표 (PRD 10장).
 * 좌석 번호 순으로 정렬하여 "좌석번호 | 학생" 형태로 보여 줍니다.
 */
export const ResultList: React.FC<ResultListProps> = ({ template, session }) => {
  const rows = getResultRows(template, session);

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

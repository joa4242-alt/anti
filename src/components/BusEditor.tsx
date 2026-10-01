import React, { useState } from 'react';
import type { BusTemplate } from '../types/bus';
import {
  COLUMN_COUNT,
  MAX_ROWS,
  MIN_ROWS,
  cellsToTemplate,
  templateToCells,
  type SeatCells,
} from '../data/customBus';
import './BusEditor.css';

interface BusEditorProps {
  baseTemplates: BusTemplate[];
  onSave: (template: BusTemplate) => void;
  onCancel: () => void;
}

/**
 * 사용자 버스 만들기 (PRD 3장 버스 편집, 23장 사용자 버스 만들기).
 * 기존 버스를 바탕으로 칸을 눌러 좌석을 넣고 빼며, 줄 수를 조절합니다.
 */
export const BusEditor: React.FC<BusEditorProps> = ({ baseTemplates, onSave, onCancel }) => {
  const [baseId, setBaseId] = useState(baseTemplates[0].id);
  const [cells, setCells] = useState<SeatCells>(() => templateToCells(baseTemplates[0]));
  const [name, setName] = useState('');

  const seatCount = cells.flat().filter(Boolean).length;
  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && seatCount > 0;

  const handleBaseChange = (id: string) => {
    const base = baseTemplates.find((t) => t.id === id);
    if (!base) return;
    setBaseId(id);
    setCells(templateToCells(base));
  };

  const toggleCell = (y: number, x: number) => {
    setCells((prev) =>
      prev.map((row, ry) => (ry === y ? row.map((v, rx) => (rx === x ? !v : v)) : row))
    );
  };

  const addRow = () => {
    if (cells.length >= MAX_ROWS) return;
    // 맨 뒷줄 앞에 일반 줄(통로 제외 4석)을 끼워 넣는다
    const normalRow = [true, true, false, true, true];
    setCells((prev) => [...prev.slice(0, -1), normalRow, prev[prev.length - 1]]);
  };

  const removeRow = () => {
    if (cells.length <= MIN_ROWS) return;
    // 맨 뒷줄은 남기고 그 앞줄을 뺀다
    setCells((prev) => [...prev.slice(0, -2), prev[prev.length - 1]]);
  };

  // 화면 표시용 번호 (앞줄부터, 왼쪽부터)
  let counter = 0;
  const numbers = cells.map((row) => row.map((hasSeat) => (hasSeat ? ++counter : 0)));

  const handleSave = () => {
    if (!canSave) return;
    onSave(cellsToTemplate(`custom-${Date.now()}`, trimmedName, cells));
  };

  return (
    <section className="bus-editor" aria-label="내 버스 만들기">
      <div className="bus-editor-header">
        <h2 className="bus-editor-title">🛠️ 내 버스 만들기</h2>
        <span className="bus-editor-count">{seatCount}석</span>
      </div>

      <p className="bus-editor-guide">
        칸을 누르면 좌석을 넣거나 뺄 수 있어요. 좌석 번호는 앞줄 왼쪽부터 자동으로 붙어요.
      </p>

      <label className="bus-editor-field">
        <span>버스 이름</span>
        <input
          type="text"
          value={name}
          maxLength={20}
          placeholder="예: ○○관광 41인승"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="bus-editor-field">
        <span>바탕 배치</span>
        <select value={baseId} onChange={(e) => handleBaseChange(e.target.value)}>
          {baseTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.capacity}석)
            </option>
          ))}
        </select>
      </label>

      <div className="bus-editor-rows">
        <span>줄 수: {cells.length}줄</span>
        <button type="button" onClick={removeRow} disabled={cells.length <= MIN_ROWS}>
          − 줄 빼기
        </button>
        <button type="button" onClick={addRow} disabled={cells.length >= MAX_ROWS}>
          + 줄 더하기
        </button>
      </div>

      <div className="bus-editor-front">▲ 앞 (운전석 / 출입문)</div>
      <div
        className="bus-editor-grid"
        style={{ gridTemplateColumns: `repeat(${COLUMN_COUNT}, 1fr)` }}
      >
        {cells.map((row, y) =>
          row.map((hasSeat, x) => (
            <button
              key={`${y}-${x}`}
              type="button"
              className={`bus-editor-cell ${hasSeat ? 'seat' : 'empty'}`}
              onClick={() => toggleCell(y, x)}
              aria-pressed={hasSeat}
              aria-label={`${y + 1}번째 줄 ${x + 1}번째 칸 ${hasSeat ? '좌석' : '빈칸'}`}
            >
              {hasSeat ? String(numbers[y][x]).padStart(2, '0') : '+'}
            </button>
          ))
        )}
      </div>
      <div className="bus-editor-front">▼ 뒤</div>

      <div className="bus-editor-actions">
        <button type="button" className="bus-editor-cancel" onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className="bus-editor-save"
          onClick={handleSave}
          disabled={!canSave}
        >
          💾 저장하고 사용하기
        </button>
      </div>
      {!canSave && (
        <p className="bus-editor-hint">
          {trimmedName.length === 0 ? '버스 이름을 입력해 주세요.' : '좌석을 1개 이상 넣어 주세요.'}
        </p>
      )}
    </section>
  );
};

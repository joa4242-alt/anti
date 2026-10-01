import type { BusTemplate, Seat } from '../types/bus';

export const COLUMN_COUNT = 5;
export const MIN_ROWS = 3;
export const MAX_ROWS = 15;

// 편집용 격자: cells[행][열] = 좌석 있음 여부
export type SeatCells = boolean[][];

export const templateToCells = (template: BusTemplate): SeatCells => {
  const cells: SeatCells = Array.from({ length: template.totalRows }, () =>
    Array<boolean>(COLUMN_COUNT).fill(false)
  );
  template.seats.forEach((seat) => {
    cells[seat.y][seat.x] = true;
  });
  return cells;
};

/**
 * 격자로부터 버스 템플릿을 만듭니다.
 * 좌석 번호는 앞줄부터, 각 줄은 왼쪽부터 1번씩 차례로 붙입니다.
 */
export const cellsToTemplate = (id: string, name: string, cells: SeatCells): BusTemplate => {
  const seats: Seat[] = [];
  cells.forEach((row, y) => {
    row.forEach((hasSeat, x) => {
      if (!hasSeat) return;
      const n = seats.length + 1;
      seats.push({ id: `${id}-seat-${n}`, number: String(n), x, y, type: 'normal' });
    });
  });

  return {
    id,
    name,
    capacity: seats.length,
    totalRows: cells.length,
    seats,
    isCustom: true,
  };
};

// 저장된 데이터가 손상됐을 때 앱이 멈추지 않도록 최소한으로 검사
export const isValidTemplate = (value: unknown): value is BusTemplate => {
  const t = value as BusTemplate;
  return (
    typeof t === 'object' &&
    t !== null &&
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.totalRows === 'number' &&
    Array.isArray(t.seats) &&
    t.seats.every(
      (s) =>
        typeof s.id === 'string' &&
        typeof s.x === 'number' &&
        typeof s.y === 'number' &&
        s.y < t.totalRows
    )
  );
};

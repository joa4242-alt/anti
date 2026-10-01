import type { BusTemplate, DrawSession, Seat } from '../types/bus';

export interface ResultRow {
  seatId: string;
  seatNumber: number;
  position: string;
  studentName: string;
}

// 좌석 위치(x, y) → 자리 설명
const getSeatPosition = (template: BusTemplate, seat: Seat) => {
  if (seat.y === template.totalRows - 1) return '맨 뒷줄';
  return seat.x === 0 || seat.x === 4 ? '창가' : '복도';
};

/**
 * 추첨 결과를 좌석번호 순 목록으로 변환합니다. (목록형 표, 인쇄, 이미지 공용)
 */
export const getResultRows = (template: BusTemplate, session: DrawSession): ResultRow[] => {
  const nameById = new Map(session.students.map((s) => [s.id, s.name]));
  const seatById = new Map(template.seats.map((s) => [s.id, s]));

  return session.assignments
    .map((a) => {
      const seat = seatById.get(a.seatId);
      return {
        seatId: a.seatId,
        seatNumber: seat ? Number(seat.number) : 0,
        position: seat ? getSeatPosition(template, seat) : '',
        studentName: nameById.get(a.studentId) ?? '',
      };
    })
    .sort((a, b) => a.seatNumber - b.seatNumber);
};

/**
 * 버스 배치를 [행][열(0~4)] 격자로 변환합니다. 좌석이 없는 칸은 null.
 */
export const getSeatGrid = (template: BusTemplate): (Seat | null)[][] => {
  const grid: (Seat | null)[][] = Array.from({ length: template.totalRows }, () =>
    Array<Seat | null>(5).fill(null)
  );
  template.seats.forEach((seat) => {
    grid[seat.y][seat.x] = seat;
  });
  return grid;
};

// 결과 파일/인쇄 제목에 쓰는 날짜 (예: 2026-10-01)
export const formatDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

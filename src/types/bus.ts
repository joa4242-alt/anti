export type SeatType = 'normal' | 'fixed' | 'disabled';

export interface Student {
  id: string;   // 고유 식별자 (동명이인 구별용)
  name: string; // 학생 이름
}

export interface Seat {
  id: string;       // 고유 식별자 (예: "seat-45-1")
  number: string;   // 화면 표시 라벨 (예: "1")
  x: number;        // 버스 열 위치 (0: 왼쪽 창가, 1: 왼쪽 복도, 2: 중앙 통로, 3: 오른쪽 복도, 4: 오른쪽 창가)
  y: number;        // 버스 행 위치 (0 ~ 10)
  type: SeatType;
}

export interface BusTemplate {
  id: string; // 기본: 'bus-45' | 'bus-28' | 'bus-25', 사용자 버스: 'custom-...'
  name: string;
  capacity: number;
  totalRows: number;
  seats: Seat[];
  isCustom?: boolean; // 사용자가 직접 만든 버스
}

export interface Assignment {
  seatId: string;
  studentId: string;
}

export interface DrawSession {
  id: string;
  busTemplateId: string;
  students: Student[];
  selectedSeatIds: string[];
  assignments: Assignment[];
  createdAt: string;
}

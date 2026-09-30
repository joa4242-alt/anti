import type { BusTemplate, Seat } from '../types/bus';

// 45인승 대형버스 좌석 생성
export const createBus45Seats = (): Seat[] => {
  const seats: Seat[] = [];
  let seatNum = 1;

  // 1~10행: 2석 - 통로 - 2석 (총 40석)
  for (let row = 0; row < 10; row++) {
    // 왼쪽 2석
    seats.push({ id: `seat-45-${seatNum}`, number: String(seatNum), x: 0, y: row, type: 'normal' });
    seatNum++;
    seats.push({ id: `seat-45-${seatNum}`, number: String(seatNum), x: 1, y: row, type: 'normal' });
    seatNum++;

    // 오른쪽 2석
    seats.push({ id: `seat-45-${seatNum}`, number: String(seatNum), x: 3, y: row, type: 'normal' });
    seatNum++;
    seats.push({ id: `seat-45-${seatNum}`, number: String(seatNum), x: 4, y: row, type: 'normal' });
    seatNum++;
  }

  // 11행 (맨 뒷줄): 5석 연속 (41~45번)
  for (let col = 0; col < 5; col++) {
    seats.push({ id: `seat-45-${seatNum}`, number: String(seatNum), x: col, y: 10, type: 'normal' });
    seatNum++;
  }

  return seats;
};

// 28인승 우등버스 좌석 생성 (2석 - 통로 - 1석 배치)
export const createBus28Seats = (): Seat[] => {
  const seats: Seat[] = [];
  let seatNum = 1;

  // 1~8행: 2석(왼쪽) - 통로 - 1석(오른쪽) (총 24석)
  for (let row = 0; row < 8; row++) {
    seats.push({ id: `seat-28-${seatNum}`, number: String(seatNum), x: 0, y: row, type: 'normal' });
    seatNum++;
    seats.push({ id: `seat-28-${seatNum}`, number: String(seatNum), x: 1, y: row, type: 'normal' });
    seatNum++;

    seats.push({ id: `seat-28-${seatNum}`, number: String(seatNum), x: 4, y: row, type: 'normal' });
    seatNum++;
  }

  // 9행 (맨 뒷줄): 4석 (25~28번)
  const lastCols = [0, 1, 3, 4];
  for (const col of lastCols) {
    seats.push({ id: `seat-28-${seatNum}`, number: String(seatNum), x: col, y: 8, type: 'normal' });
    seatNum++;
  }

  return seats;
};

// 25인승 중형버스 좌석 생성 (1석 - 통로 - 2석 배치)
export const createBus25Seats = (): Seat[] => {
  const seats: Seat[] = [];
  let seatNum = 1;

  // 1~7행: 1석(왼쪽) - 통로 - 2석(오른쪽) (총 21석)
  for (let row = 0; row < 7; row++) {
    seats.push({ id: `seat-25-${seatNum}`, number: String(seatNum), x: 0, y: row, type: 'normal' });
    seatNum++;

    seats.push({ id: `seat-25-${seatNum}`, number: String(seatNum), x: 3, y: row, type: 'normal' });
    seatNum++;
    seats.push({ id: `seat-25-${seatNum}`, number: String(seatNum), x: 4, y: row, type: 'normal' });
    seatNum++;
  }

  // 8행 (맨 뒷줄): 4석 (22~25번)
  const lastCols = [0, 1, 3, 4];
  for (const col of lastCols) {
    seats.push({ id: `seat-25-${seatNum}`, number: String(seatNum), x: col, y: 7, type: 'normal' });
    seatNum++;
  }

  return seats;
};

export const BUS_45_TEMPLATE: BusTemplate = {
  id: 'bus-45',
  name: '45인승 대형버스',
  capacity: 45,
  totalRows: 11,
  seats: createBus45Seats(),
};

export const BUS_28_TEMPLATE: BusTemplate = {
  id: 'bus-28',
  name: '28인승 우등버스',
  capacity: 28,
  totalRows: 9,
  seats: createBus28Seats(),
};

export const BUS_25_TEMPLATE: BusTemplate = {
  id: 'bus-25',
  name: '25인승 중형버스',
  capacity: 25,
  totalRows: 8,
  seats: createBus25Seats(),
};

export const BUS_TEMPLATES: BusTemplate[] = [
  BUS_45_TEMPLATE,
  BUS_28_TEMPLATE,
  BUS_25_TEMPLATE,
];

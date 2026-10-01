import { describe, expect, it } from 'vitest';
import { createDrawSession, removeSeats, reshuffleSeats, shuffle } from '../utils/drawEngine';
import type { Student } from '../types/bus';

const makeStudents = (n: number): Student[] =>
  Array.from({ length: n }, (_, i) => ({ id: `student-${i + 1}`, name: `학생${i + 1}` }));
const makeSeats = (n: number) => Array.from({ length: n }, (_, i) => `seat-${i + 1}`);

// PRD 18장 핵심 비즈니스 규칙, 21장 추첨 시나리오
describe('추첨 엔진', () => {
  it('학생 1명은 좌석 1개, 좌석 1개에는 학생 1명 (결과 중복 없음)', () => {
    for (let t = 0; t < 200; t++) {
      const session = createDrawSession('bus-45', makeStudents(32), makeSeats(32));
      expect(new Set(session.assignments.map((a) => a.seatId)).size).toBe(32);
      expect(new Set(session.assignments.map((a) => a.studentId)).size).toBe(32);
    }
  });

  it('선택하지 않은 좌석에는 배정하지 않는다', () => {
    const selected = ['seat-2', 'seat-5', 'seat-7', 'seat-11'];
    for (let t = 0; t < 200; t++) {
      const session = createDrawSession('bus-45', makeStudents(4), selected);
      session.assignments.forEach((a) => expect(selected).toContain(a.seatId));
    }
  });

  it('좌석이 부족하거나 남으면 추첨하지 않는다', () => {
    expect(() => createDrawSession('bus-45', makeStudents(32), makeSeats(30))).toThrow();
    expect(() => createDrawSession('bus-45', makeStudents(32), makeSeats(34))).toThrow();
    expect(() => createDrawSession('bus-45', [], [])).toThrow();
  });

  it('모든 학생이 모든 좌석에 고르게 배정된다 (공정성)', () => {
    const n = 5;
    const runs = 50000;
    const counts = Array.from({ length: n }, () => Array<number>(n).fill(0));
    for (let t = 0; t < runs; t++) {
      const session = createDrawSession('bus-45', makeStudents(n), makeSeats(n));
      session.assignments.forEach((a) => {
        counts[Number(a.studentId.split('-')[1]) - 1][Number(a.seatId.split('-')[1]) - 1]++;
      });
    }
    // 기대값 10000, 표준편차 약 89 → 5표준편차(450) 이내여야 함
    counts.flat().forEach((c) => expect(Math.abs(c - runs / n)).toBeLessThan(450));
  });

  it('shuffle은 원본을 바꾸지 않고 같은 원소를 유지한다', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort()).toEqual(original);
  });
});

describe('부분 재추첨', () => {
  const base = createDrawSession('bus-45', makeStudents(10), makeSeats(10));
  const before = new Map(base.assignments.map((a) => [a.seatId, a.studentId]));
  const picked = ['seat-2', 'seat-5', 'seat-9'];

  it('고른 자리 밖의 학생은 움직이지 않는다', () => {
    for (let t = 0; t < 200; t++) {
      const after = new Map(
        reshuffleSeats(base, picked).assignments.map((a) => [a.seatId, a.studentId])
      );
      before.forEach((studentId, seatId) => {
        if (!picked.includes(seatId)) expect(after.get(seatId)).toBe(studentId);
      });
      expect(picked.map((s) => after.get(s)).sort()).toEqual(
        picked.map((s) => before.get(s)).sort()
      );
    }
  });

  it('2자리 미만이면 다시 추첨하지 않는다', () => {
    expect(() => reshuffleSeats(base, ['seat-1'])).toThrow();
  });

  it('결석 처리하면 학생과 좌석이 함께 빠진다', () => {
    const result = removeSeats(base, ['seat-3']);
    expect(result.students).toHaveLength(9);
    expect(result.assignments).toHaveLength(9);
    expect(result.selectedSeatIds).not.toContain('seat-3');
    expect(result.students.map((s) => s.id)).not.toContain(before.get('seat-3'));
  });
});

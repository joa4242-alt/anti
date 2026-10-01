import { describe, expect, it } from 'vitest';
import { BUS_TEMPLATES } from '../data/busTemplates';
import { cellsToTemplate, isValidTemplate, templateToCells } from '../data/customBus';
import { upsertWork, type SavedWork } from '../data/savedWorks';
import { createDrawSession } from '../utils/drawEngine';
import { getResultRows, getSeatGrid } from '../utils/resultRows';

describe('기본 버스 3종', () => {
  it.each([
    ['bus-45', 45],
    ['bus-28', 28],
    ['bus-25', 25],
  ])('%s는 %i석이고 좌석 ID·위치가 겹치지 않는다', (id, capacity) => {
    const template = BUS_TEMPLATES.find((t) => t.id === id)!;
    expect(template.seats).toHaveLength(capacity);
    expect(template.capacity).toBe(capacity);
    expect(new Set(template.seats.map((s) => s.id)).size).toBe(capacity);
    expect(new Set(template.seats.map((s) => `${s.x}-${s.y}`)).size).toBe(capacity);
    template.seats.forEach((s) => expect(s.y).toBeLessThan(template.totalRows));
  });
});

describe('내 버스 만들기', () => {
  it('격자 ↔ 버스 변환이 그대로 유지되고 번호는 앞줄 왼쪽부터 붙는다', () => {
    const base = BUS_TEMPLATES[0];
    const custom = cellsToTemplate('custom-1', '테스트', templateToCells(base));
    expect(custom.seats.map((s) => [s.x, s.y])).toEqual(base.seats.map((s) => [s.x, s.y]));
    expect(custom.seats.map((s) => s.number)).toEqual(custom.seats.map((_, i) => String(i + 1)));
    expect(custom.isCustom).toBe(true);
  });

  it('손상된 저장 데이터는 거른다', () => {
    expect(isValidTemplate(BUS_TEMPLATES[1])).toBe(true);
    expect(isValidTemplate(null)).toBe(false);
    expect(
      isValidTemplate({ id: 'x', name: 'x', totalRows: 2, seats: [{ id: 's', x: 0, y: 5 }] })
    ).toBe(false);
  });
});

describe('결과 목록', () => {
  it('좌석번호 순으로 정렬하고 위치를 붙인다', () => {
    const template = BUS_TEMPLATES[0];
    const students = Array.from({ length: 45 }, (_, i) => ({
      id: `student-${i + 1}`,
      name: `학생${i + 1}`,
    }));
    const session = createDrawSession(template.id, students, template.seats.map((s) => s.id));
    const rows = getResultRows(template, session);
    expect(rows.map((r) => r.seatNumber)).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
    expect(rows[0].position).toBe('창가');
    expect(rows[1].position).toBe('복도');
    expect(rows[44].position).toBe('맨 뒷줄');
  });

  it('버스 격자는 통로 칸을 비워 둔다', () => {
    const grid = getSeatGrid(BUS_TEMPLATES[0]);
    expect(grid).toHaveLength(11);
    expect(grid[0][2]).toBeNull();
    expect(grid[10][2]).not.toBeNull();
  });
});

describe('저장된 작업', () => {
  const work = (id: string): SavedWork => ({
    id,
    title: id,
    updatedAt: new Date().toISOString(),
    templateId: 'bus-45',
    templateName: '45인승 대형버스',
    rawStudentText: '',
    studentCount: 0,
    selectedSeatIds: [],
    drawSession: null,
  });

  it('같은 작업은 덮어쓰고 맨 앞으로 옮긴다', () => {
    const result = upsertWork([work('a'), work('b')], { ...work('b'), title: '수정' });
    expect(result.map((w) => w.id)).toEqual(['b', 'a']);
    expect(result[0].title).toBe('수정');
  });

  it('최대 20개까지만 보관한다', () => {
    let works: SavedWork[] = [];
    for (let i = 0; i < 25; i++) works = upsertWork(works, work(`w${i}`));
    expect(works).toHaveLength(20);
    expect(works[0].id).toBe('w24');
  });
});

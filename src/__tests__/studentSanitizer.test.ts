import { describe, expect, it } from 'vitest';
import { parseStudentList } from '../utils/studentSanitizer';

// PRD 21장 테스트 시나리오: 학생 명단
describe('학생 명단 정리', () => {
  it.each([1, 10, 25, 32, 45])('%i명을 정확히 센다', (n) => {
    const text = Array.from({ length: n }, (_, i) => `학생${i + 1}`).join('\n');
    expect(parseStudentList(text)).toHaveLength(n);
  });

  it('빈 줄과 앞뒤 공백을 지운다', () => {
    expect(parseStudentList('\n  김민수  \n\n\n이서준\n   \n').map((s) => s.name)).toEqual([
      '김민수',
      '이서준',
    ]);
  });

  it('이름 안의 연속 공백을 한 칸으로 정리한다', () => {
    const students = parseStudentList('이   준\n김\t민수');
    expect(students.map((s) => s.name)).toEqual(['이 준', '김 민수']);
  });

  it('윈도우에서 복사·붙여넣기한 줄바꿈(CRLF)도 처리한다', () => {
    expect(parseStudentList('김민수\r\n이서준\r\n').map((s) => s.name)).toEqual([
      '김민수',
      '이서준',
    ]);
  });

  it('동명이인은 서로 다른 학생으로 구분한다', () => {
    const students = parseStudentList('김민수\n김민수');
    expect(students).toHaveLength(2);
    expect(students[0].id).not.toBe(students[1].id);
  });

  it('빈 입력은 0명', () => {
    expect(parseStudentList('')).toEqual([]);
    expect(parseStudentList('\n \n')).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { extractNames, parseCsv } from '../utils/importStudents';

// PRD 21장 테스트 시나리오: Excel
describe('엑셀 명단에서 이름 찾기', () => {
  it('"이름" 제목 칸 아래를 읽는다 (번호·성별 칸은 무시)', () => {
    const table = [
      ['5학년 2반 명단'],
      ['번호', '이름', '성별'],
      [1, '김하늘', '여'],
      [2, '박바다', '남'],
      [3, '김하늘', '남'],
    ];
    expect(extractNames(table)).toEqual(['김하늘', '박바다', '김하늘']);
  });

  it('"성명" 제목도 알아본다', () => {
    expect(extractNames([['성명'], ['오솔길'], ['서하린']])).toEqual(['오솔길', '서하린']);
  });

  it('제목이 없으면 이름이 가장 많은 칸을 고른다', () => {
    const table = [
      [1, '최가람', '여'],
      [2, '정나래', '여'],
      [3, '한다솜', '남'],
    ];
    expect(extractNames(table)).toEqual(['최가람', '정나래', '한다솜']);
  });

  it('빈 칸과 숫자 칸은 건너뛴다', () => {
    expect(extractNames([['이름'], ['김민수'], [null], ['  '], [123], ['이서준']])).toEqual([
      '김민수',
      '이서준',
    ]);
  });

  it('이름이 없으면 빈 목록', () => {
    expect(extractNames([[1], [2], [3]])).toEqual([]);
  });
});

describe('CSV 읽기', () => {
  it('쉼표가 들어간 따옴표 칸과 CRLF 줄바꿈을 처리한다', () => {
    expect(parseCsv('번호,성명\r\n1,"윤, 별"\r\n2,"따""옴표"\r\n')).toEqual([
      ['번호', '성명'],
      ['1', '윤, 별'],
      ['2', '따"옴표'],
    ]);
  });

  it('탭으로 구분된 내용도 읽는다', () => {
    expect(parseCsv('1\t김민수\n2\t이서준')).toEqual([
      ['1', '김민수'],
      ['2', '이서준'],
    ]);
  });
});

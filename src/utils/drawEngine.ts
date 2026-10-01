import type { Assignment, DrawSession, Student } from '../types/bus';

/**
 * [0, max) 범위의 균등 분포 정수를 반환합니다.
 * crypto.getRandomValues + 거절 샘플링으로 모듈로 편향을 제거합니다.
 */
const randomInt = (max: number): number => {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
};

/**
 * Fisher–Yates 셔플. 원본을 변경하지 않고 새 배열을 반환합니다.
 */
export const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 학생과 선택 좌석을 1:1 무작위 매칭하여 추첨 결과를 생성합니다.
 * - 학생 수와 선택 좌석 수가 같아야 합니다.
 * - 선택된 좌석만 사용하며, 좌석/학생 모두 중복 없이 배정됩니다.
 */
export const createDrawSession = (
  busTemplateId: string,
  students: Student[],
  selectedSeatIds: string[]
): DrawSession => {
  if (students.length === 0 || students.length !== selectedSeatIds.length) {
    throw new Error(
      `학생 수(${students.length})와 선택 좌석 수(${selectedSeatIds.length})가 일치하지 않습니다.`
    );
  }

  const shuffledSeatIds = shuffle(selectedSeatIds);
  const assignments: Assignment[] = students.map((student, i) => ({
    seatId: shuffledSeatIds[i],
    studentId: student.id,
  }));

  return {
    id: `draw-${Date.now()}`,
    busTemplateId,
    students: [...students],
    selectedSeatIds: [...selectedSeatIds],
    assignments,
    createdAt: new Date().toISOString(),
  };
};

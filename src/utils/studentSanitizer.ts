import type { Student } from '../types/bus';

/**
 * 줄바꿈 텍스트를 파싱하여 정제된 Student 객체 배열을 생성합니다.
 * - 한 줄당 학생 1명으로 처리
 * - 앞뒤 공백 및 빈 줄 제거, 이름 안의 연속 공백은 한 칸으로
 * - 동명이인을 지원하기 위해 각 줄마다 고유 studentId 부여
 */
export const parseStudentList = (rawText: string): Student[] => {
  if (!rawText) return [];

  const lines = rawText.split('\n');
  const sanitizedStudents: Student[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim().replace(/\s+/g, ' ');
    if (trimmed.length > 0) {
      sanitizedStudents.push({
        id: `student-${sanitizedStudents.length + 1}`,
        name: trimmed,
      });
    }
  });

  return sanitizedStudents;
};

/**
 * 개발 및 테스트용 초등학교 30명 샘플 학생 명단
 */
export const SAMPLE_STUDENTS_30 = [
  '김민수',
  '이서준',
  '박지우',
  '최예은',
  '정하은',
  '강도윤',
  '조시우',
  '윤서아',
  '장주원',
  '임수아',
  '한지호',
  '오유진',
  '서준혁',
  '신다은',
  '권우진',
  '황지민',
  '안현우',
  '송채원',
  '류태양',
  '전소율',
  '홍건우',
  '고은지',
  '문재윤',
  '양아인',
  '손민준',
  '배서연',
  '백승현',
  '허윤슬',
  '유다현',
  '김민수', // 동명이인 포함 테스트용
].join('\n');

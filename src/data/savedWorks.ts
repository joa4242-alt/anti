import type { DrawSession } from '../types/bus';
import { STORAGE_KEYS, loadJSON, saveJSON } from '../utils/storage';

/**
 * 저장된 작업 (PRD 14장 최근 작업, 23장 학급 관리).
 * 예: "5학년 2반 체험학습" - 45인승 - 학생 32명 - 추첨 결과
 */
export interface SavedWork {
  id: string;
  title: string;
  updatedAt: string;
  templateId: string;
  templateName: string;
  rawStudentText: string;
  studentCount: number;
  selectedSeatIds: string[];
  drawSession: DrawSession | null;
}

const MAX_WORKS = 20;

const isValidWork = (value: unknown): value is SavedWork => {
  const w = value as SavedWork;
  return (
    typeof w === 'object' &&
    w !== null &&
    typeof w.id === 'string' &&
    typeof w.title === 'string' &&
    typeof w.updatedAt === 'string' &&
    typeof w.templateId === 'string' &&
    typeof w.rawStudentText === 'string' &&
    Array.isArray(w.selectedSeatIds) &&
    (w.drawSession === null ||
      (typeof w.drawSession === 'object' && Array.isArray(w.drawSession.assignments)))
  );
};

// 최근 수정 순으로 정렬해 반환
export const loadWorks = (): SavedWork[] =>
  loadJSON<unknown[]>(STORAGE_KEYS.savedWorks, [])
    .filter(isValidWork)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

// 같은 ID는 덮어쓰고, 최근 것부터 최대 MAX_WORKS개만 보관
export const upsertWork = (works: SavedWork[], work: SavedWork): SavedWork[] =>
  [work, ...works.filter((w) => w.id !== work.id)].slice(0, MAX_WORKS);

export const persistWorks = (works: SavedWork[]) => saveJSON(STORAGE_KEYS.savedWorks, works);

export const newWorkId = () => `work-${Date.now()}`;

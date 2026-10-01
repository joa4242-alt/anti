/**
 * 브라우저 내부 저장(localStorage) 도우미.
 * 학생 명단 등은 이 기기 안에만 저장되며 외부 서버로 보내지 않습니다 (PRD 13장).
 * 사생활 보호 모드 등에서 저장소를 쓸 수 없으면 조용히 기본값을 사용합니다.
 */

export const STORAGE_KEYS = {
  customBuses: 'busSeats.customBuses',
  savedWorks: 'busSeats.savedWorks',
  soundOn: 'soundOn',
} as const;

export const loadJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

export const saveJSON = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const removeKey = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // 무시
  }
};

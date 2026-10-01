import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawSession } from '../types/bus';

// PRD 8장: 0~4초 빠르게 변경 → 4~5초 감속 → 5초 확정
const DRAW_DURATION_MS = 5000;
const FAST_PHASE_MS = 4000;
const FAST_INTERVAL_MS = 80;
const SLOW_INTERVAL_MAX_MS = 400;

interface DrawAnimationCallbacks {
  onTick: () => void;
  onReveal: () => void;
}

/**
 * 추첨 연출 전용 훅.
 * 실제 결과(DrawSession)는 이미 만들어진 상태이며, 여기서는 좌석마다
 * 임의의 이름을 보여 주는 시각 효과만 담당합니다. 결과를 다시 계산하지 않습니다.
 */
export const useDrawAnimation = ({ onTick, onReveal }: DrawAnimationCallbacks) => {
  // 연출 중 좌석 ID → 화면에 잠깐 보여 줄 이름. null이면 연출 중이 아님.
  const [spinNames, setSpinNames] = useState<Map<string, string> | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancel = useCallback(() => {
    clearTimer();
    setSpinNames(null);
  }, []);

  useEffect(() => clearTimer, []);

  // onlySeatIds를 주면 그 좌석만 연출한다 (부분 재추첨)
  const start = (session: DrawSession, onlySeatIds?: string[]) => {
    clearTimer();
    const onlySet = onlySeatIds ? new Set(onlySeatIds) : null;
    const targets = session.assignments.filter((a) => !onlySet || onlySet.has(a.seatId));
    const seatIds = targets.map((a) => a.seatId);
    const nameById = new Map(session.students.map((s) => [s.id, s.name]));
    const names = targets.map((a) => nameById.get(a.studentId) ?? '');
    const startedAt = performance.now();

    const step = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= DRAW_DURATION_MS) {
        timerRef.current = null;
        setSpinNames(null);
        onReveal();
        return;
      }

      setSpinNames(
        new Map(
          seatIds.map((id) => [id, names[Math.floor(Math.random() * names.length)]])
        )
      );
      onTick();

      // 감속 구간에서는 간격을 점점 늘린다
      const slowProgress = Math.max(0, elapsed - FAST_PHASE_MS) / (DRAW_DURATION_MS - FAST_PHASE_MS);
      const interval =
        FAST_INTERVAL_MS + slowProgress * (SLOW_INTERVAL_MAX_MS - FAST_INTERVAL_MS);
      timerRef.current = window.setTimeout(
        step,
        Math.min(interval, DRAW_DURATION_MS - elapsed)
      );
    };

    step();
  };

  return { spinNames, isDrawing: spinNames !== null, start, cancel };
};

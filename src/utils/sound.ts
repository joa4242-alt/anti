/**
 * Web Audio API로 효과음을 합성합니다. (음원 파일 없이 오프라인에서도 동작)
 * 브라우저 자동재생 제한 때문에 반드시 사용자 클릭 안에서 unlockAudio()를 먼저 호출해야 합니다.
 */

let audioCtx: AudioContext | null = null;

export const unlockAudio = () => {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
};

const playTone = (
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  volume: number
) => {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + startOffset;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration);
};

// 슬롯머신 스타일 '틱' 소리 (이름이 바뀔 때마다)
export const playTick = () => {
  playTone(700 + Math.random() * 300, 0, 0.04, 'square', 0.04);
};

// 결과 확정 축하 팡파르
export const playFanfare = () => {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => playTone(freq, i * 0.11, 0.25, 'triangle', 0.18));
  // 마지막에 화음으로 한 번 더
  notes.forEach((freq) => playTone(freq, 0.5, 0.9, 'triangle', 0.1));
};

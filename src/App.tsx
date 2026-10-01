import { useState, useMemo, useRef } from 'react';
import { BUS_TEMPLATES } from './data/busTemplates';
import { BusLayout } from './components/BusLayout';
import { StudentInput } from './components/StudentInput';
import { ValidationBanner } from './components/ValidationBanner';
import { Confetti } from './components/Confetti';
import { ResultList } from './components/ResultList';
import { useDrawAnimation } from './hooks/useDrawAnimation';
import { playFanfare, playTick, unlockAudio } from './utils/sound';
import { parseStudentList } from './utils/studentSanitizer';
import { createDrawSession } from './utils/drawEngine';
import type { DrawSession } from './types/bus';
import './App.css';

function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('bus-45');
  const [rawStudentText, setRawStudentText] = useState<string>('');
  // 추첨 결과. 입력(버스/명단)이 바뀌면 무효화합니다.
  const [drawSession, setDrawSession] = useState<DrawSession | null>(null);
  // 결과 보기 방식: 버스형 / 목록형 (PRD 10장)
  const [resultView, setResultView] = useState<'bus' | 'list'>('bus');

  // 사운드 ON/OFF (연출 도중 토글도 즉시 반영되도록 ref로도 보관)
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('soundOn') !== 'false';
    } catch {
      return true;
    }
  });
  const soundOnRef = useRef(soundOn);
  const busAreaRef = useRef<HTMLDivElement>(null);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    try {
      localStorage.setItem('soundOn', String(next));
    } catch {
      // 저장 실패는 무시 (사생활 보호 모드 등)
    }
  };

  // 추첨 연출: 결과는 이미 drawSession에 있고, 연출이 끝나면 공개된다
  const drawAnimation = useDrawAnimation({
    onTick: () => {
      if (soundOnRef.current) playTick();
    },
    onReveal: () => {
      if (soundOnRef.current) playFanfare();
    },
  });
  const isDrawing = drawAnimation.isDrawing;

  const currentTemplate =
    BUS_TEMPLATES.find((t) => t.id === selectedTemplateId) || BUS_TEMPLATES[0];

  // 정제된 학생 객체 목록
  const parsedStudents = useMemo(
    () => parseStudentList(rawStudentText),
    [rawStudentText]
  );

  // 초기 상태: 현재 버스 템플릿의 전체 좌석 ID 선택
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(() =>
    currentTemplate.seats.map((s) => s.id)
  );

  // 좌석 ID → 학생 이름 (결과 표시용)
  const resultNames = useMemo(() => {
    if (!drawSession) return undefined;
    const nameById = new Map(drawSession.students.map((s) => [s.id, s.name]));
    return new Map(
      drawSession.assignments.map((a) => [a.seatId, nameById.get(a.studentId) ?? ''])
    );
  }, [drawSession]);

  // 연출 중에는 임시 이름, 끝나면 실제 결과
  const assignedNames = drawAnimation.spinNames ?? resultNames;

  // 명단 변경 처리
  const handleStudentTextChange = (text: string) => {
    setRawStudentText(text);
    setDrawSession(null);
  };

  // 템플릿 변경 처리
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setDrawSession(null);
    const newTemplate =
      BUS_TEMPLATES.find((t) => t.id === templateId) || BUS_TEMPLATES[0];
    setSelectedSeatIds(newTemplate.seats.map((s) => s.id));
  };

  // 좌석 단일 선택/해제 토글
  const handleToggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  // 전체 선택
  const handleSelectAll = () => {
    setSelectedSeatIds(currentTemplate.seats.map((s) => s.id));
  };

  // 전체 해제
  const handleDeselectAll = () => {
    setSelectedSeatIds([]);
  };

  // 추첨 실행: 실제 결과 생성 → 내부 보관 → 5초 연출 → 공개
  const handleStartDraw = () => {
    // 클릭(사용자 상호작용) 안에서 오디오를 깨워야 자동재생 제한에 걸리지 않는다
    unlockAudio();
    const session = createDrawSession(
      currentTemplate.id,
      parsedStudents,
      selectedSeatIds
    );
    setDrawSession(session);
    drawAnimation.start(session);
    // 휴대폰에서도 연출이 보이도록 버스 화면으로 이동
    busAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 전체 재추첨 (PRD 11장: 확인 후 진행)
  const handleRedraw = () => {
    if (window.confirm('현재 결과를 새로운 결과로 바꿀까요?')) {
      handleStartDraw();
    }
  };

  // 결과를 닫고 좌석 선택 화면으로 복귀
  const handleResetDraw = () => {
    drawAnimation.cancel();
    setDrawSession(null);
  };

  // 처음으로: 명단·좌석·결과를 모두 초기 상태로
  const handleGoHome = () => {
    if (!window.confirm('학생 명단과 추첨 결과가 모두 지워집니다. 처음으로 돌아갈까요?')) {
      return;
    }
    drawAnimation.cancel();
    setDrawSession(null);
    setResultView('bus');
    setRawStudentText('');
    handleTemplateChange(BUS_TEMPLATES[0].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showResultList = drawSession !== null && !isDrawing && resultView === 'list';

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🚌 체험학습 버스자리</h1>
        <p className="app-subtitle">초등학교 체험학습용 버스 좌석 배치</p>
        <button
          type="button"
          className="sound-toggle-btn"
          onClick={handleToggleSound}
          aria-pressed={soundOn}
        >
          {soundOn ? '🔊 소리 ON' : '🔇 소리 OFF'}
        </button>
      </header>

      <main className="app-main">
        {/* 버스 템플릿 선택 탭 */}
        <section className="bus-selector-section">
          <label className="selector-label">버스 종류 선택</label>
          <div className="bus-tab-group">
            {BUS_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`bus-tab-button ${
                  selectedTemplateId === template.id ? 'active' : ''
                }`}
                onClick={() => handleTemplateChange(template.id)}
                disabled={isDrawing}
              >
                <span className="tab-icon">🚌</span>
                <span className="tab-name">{template.name}</span>
                <span className="tab-badge">{template.capacity}석</span>
              </button>
            ))}
          </div>
        </section>

        {/* 학생 명단 입력 섹션 */}
        <StudentInput
          rawText={rawStudentText}
          students={parsedStudents}
          onTextChange={handleStudentTextChange}
          disabled={isDrawing}
        />

        {/* 버스 정보 & 현황 요약 카드 */}
        <section className="bus-info-card">
          <div className="info-item">
            <span className="info-label">현재 버스</span>
            <span className="info-value">{currentTemplate.name}</span>
          </div>
          <div className="info-divider" />
          <div className="info-item">
            <span className="info-label">학생 수</span>
            <span className="info-value badge-count">{parsedStudents.length}명</span>
          </div>
          <div className="info-divider" />
          <div className="info-item">
            <span className="info-label">선택 좌석</span>
            <span className="info-value highlight-select">
              {selectedSeatIds.length}석
            </span>
          </div>
        </section>

        {isDrawing ? (
          /* 추첨 연출 중 */
          <section className="seat-control-toolbar" aria-live="polite">
            <span className="control-guide-text drawing-status-text">
              🎰 추첨 중입니다... 두근두근!
            </span>
          </section>
        ) : drawSession ? (
          /* 추첨 결과 툴바 */
          <section className="seat-control-toolbar">
            <span className="control-guide-text">
              🎉 학생 {drawSession.assignments.length}명의 자리 배정이 완료되었습니다.
              <Confetti key={drawSession.id} />
            </span>
            <div className="result-view-tabs" role="tablist" aria-label="결과 보기 방식">
              <button
                type="button"
                role="tab"
                aria-selected={resultView === 'bus'}
                className={`result-view-tab ${resultView === 'bus' ? 'active' : ''}`}
                onClick={() => setResultView('bus')}
              >
                🚌 버스형
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={resultView === 'list'}
                className={`result-view-tab ${resultView === 'list' ? 'active' : ''}`}
                onClick={() => setResultView('list')}
              >
                📋 목록형
              </button>
            </div>
            <div className="control-button-group">
              <button
                type="button"
                className="ctrl-btn select-all-btn"
                onClick={handleRedraw}
              >
                🔄 전체 재추첨
              </button>
              <button
                type="button"
                className="ctrl-btn deselect-all-btn"
                onClick={handleResetDraw}
              >
                ✏️ 좌석 수정
              </button>
              <button
                type="button"
                className="ctrl-btn home-btn"
                onClick={handleGoHome}
              >
                🏠 처음으로
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* 유효성 검증 및 추첨 시작 배너 */}
            <ValidationBanner
              studentCount={parsedStudents.length}
              selectedSeatCount={selectedSeatIds.length}
              onStartDraw={handleStartDraw}
            />

            {/* 좌석 선택 제어 툴바 */}
            <section className="seat-control-toolbar">
              <span className="control-guide-text">
                💡 좌석을 터치하여 추첨 대상 좌석을 선택/해제하세요.
              </span>
              <div className="control-button-group">
                <button
                  type="button"
                  className="ctrl-btn select-all-btn"
                  onClick={handleSelectAll}
                >
                  ✓ 전체 선택 ({currentTemplate.capacity}석)
                </button>
                <button
                  type="button"
                  className="ctrl-btn deselect-all-btn"
                  onClick={handleDeselectAll}
                >
                  ✕ 전체 해제
                </button>
              </div>
            </section>
          </>
        )}

        {/* 좌석 배치 및 인터랙션 레이아웃 */}
        <div ref={busAreaRef} className="result-area">
          {showResultList ? (
            <ResultList template={currentTemplate} session={drawSession} />
          ) : (
            <BusLayout
              template={currentTemplate}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
              assignedNames={assignedNames}
              isSpinning={isDrawing}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>체험학습 버스자리 PWA - 결과 화면 완료</p>
      </footer>
    </div>
  );
}

export default App;

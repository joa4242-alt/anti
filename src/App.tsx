import { useState, useMemo, useRef } from 'react';
import { BUS_TEMPLATES } from './data/busTemplates';
import { BusLayout } from './components/BusLayout';
import { StudentInput } from './components/StudentInput';
import { ValidationBanner } from './components/ValidationBanner';
import { Confetti } from './components/Confetti';
import { ResultList } from './components/ResultList';
import { PrintSheet } from './components/PrintSheet';
import { BusEditor } from './components/BusEditor';
import { isValidTemplate } from './data/customBus';
import { STORAGE_KEYS, loadJSON, saveJSON } from './utils/storage';
import { downloadResultImage } from './utils/exportImage';
import { useDrawAnimation } from './hooks/useDrawAnimation';
import { playFanfare, playTick, unlockAudio } from './utils/sound';
import { parseStudentList } from './utils/studentSanitizer';
import { createDrawSession, removeSeats, reshuffleSeats } from './utils/drawEngine';
import type { BusTemplate, DrawSession } from './types/bus';
import './App.css';

function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('bus-45');
  const [rawStudentText, setRawStudentText] = useState<string>('');
  // 추첨 결과. 입력(버스/명단)이 바뀌면 무효화합니다.
  const [drawSession, setDrawSession] = useState<DrawSession | null>(null);
  // 결과 보기 방식: 버스형 / 목록형 (PRD 10장)
  const [resultView, setResultView] = useState<'bus' | 'list'>('bus');
  // 사용자가 만든 버스 (이 기기에 저장)
  const [customBuses, setCustomBuses] = useState<BusTemplate[]>(() =>
    loadJSON<unknown[]>(STORAGE_KEYS.customBuses, []).filter(isValidTemplate)
  );
  const [isEditingBus, setIsEditingBus] = useState(false);
  const allTemplates = useMemo(() => [...BUS_TEMPLATES, ...customBuses], [customBuses]);

  // 사운드 ON/OFF (연출 도중 토글도 즉시 반영되도록 ref로도 보관)
  const [soundOn, setSoundOn] = useState<boolean>(
    () => loadJSON<boolean>(STORAGE_KEYS.soundOn, true) !== false
  );
  const soundOnRef = useRef(soundOn);
  const busAreaRef = useRef<HTMLDivElement>(null);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    saveJSON(STORAGE_KEYS.soundOn, next);
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
    allTemplates.find((t) => t.id === selectedTemplateId) || BUS_TEMPLATES[0];

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

  // 연출 중에는 임시 이름(부분 재추첨이면 해당 좌석만), 끝나면 실제 결과
  const spinNames = drawAnimation.spinNames;
  const assignedNames = spinNames ? new Map([...(resultNames ?? []), ...spinNames]) : resultNames;
  const spinningSeatIds = spinNames ? new Set(spinNames.keys()) : undefined;

  // 결과 화면에서 고른 좌석 (결과가 바뀌면 자동으로 비워지도록 결과 ID와 함께 보관)
  const [picked, setPicked] = useState<{ sessionId: string; seatIds: string[] }>({
    sessionId: '',
    seatIds: [],
  });
  const pickedSeatIds = drawSession && picked.sessionId === drawSession.id ? picked.seatIds : [];
  const pickedSet = new Set(pickedSeatIds);

  // 명단 변경 처리
  const handleStudentTextChange = (text: string) => {
    setRawStudentText(text);
    setDrawSession(null);
  };

  // 템플릿 변경 처리
  const selectTemplate = (template: BusTemplate) => {
    setSelectedTemplateId(template.id);
    setDrawSession(null);
    setSelectedSeatIds(template.seats.map((s) => s.id));
  };

  const handleTemplateChange = (templateId: string) => {
    selectTemplate(allTemplates.find((t) => t.id === templateId) || BUS_TEMPLATES[0]);
  };

  // 내 버스 저장
  const handleSaveCustomBus = (template: BusTemplate) => {
    const next = [...customBuses, template];
    setCustomBuses(next);
    if (!saveJSON(STORAGE_KEYS.customBuses, next)) {
      alert('이 브라우저에는 저장할 수 없어서, 페이지를 닫으면 이 버스가 사라집니다.');
    }
    setIsEditingBus(false);
    selectTemplate(template);
  };

  // 내 버스 삭제
  const handleDeleteCustomBus = () => {
    if (!currentTemplate.isCustom) return;
    if (!window.confirm(`'${currentTemplate.name}' 버스를 삭제할까요?`)) return;
    const next = customBuses.filter((t) => t.id !== currentTemplate.id);
    setCustomBuses(next);
    saveJSON(STORAGE_KEYS.customBuses, next);
    selectTemplate(BUS_TEMPLATES[0]);
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

  // 결과 화면에서 좌석 고르기/취소
  const handlePickSeat = (seatId: string) => {
    if (!drawSession) return;
    const sessionId = drawSession.id;
    setPicked((prev) => {
      const current = prev.sessionId === sessionId ? prev.seatIds : [];
      return {
        sessionId,
        seatIds: current.includes(seatId)
          ? current.filter((id) => id !== seatId)
          : [...current, seatId],
      };
    });
  };

  const clearPicked = () => setPicked({ sessionId: '', seatIds: [] });

  // 고른 좌석의 학생 이름
  const pickedNames = () => {
    const nameById = new Map(drawSession?.students.map((st) => [st.id, st.name]));
    return (drawSession?.assignments ?? [])
      .filter((a) => pickedSet.has(a.seatId))
      .map((a) => nameById.get(a.studentId) ?? '');
  };

  // 부분 재추첨: 고른 자리끼리만 다시 섞기
  const handlePartialRedraw = () => {
    if (!drawSession || pickedSeatIds.length < 2) return;
    const names = pickedNames();
    if (!window.confirm(`${names.join(', ')} 학생 ${names.length}명의 자리만 서로 다시 추첨할까요?\n다른 학생 자리는 그대로예요.`)) {
      return;
    }
    unlockAudio();
    const session = reshuffleSeats(drawSession, pickedSeatIds);
    setDrawSession(session);
    drawAnimation.start(session, pickedSeatIds);
  };

  // 결석 처리: 고른 자리의 학생을 명단에서 빼고 자리를 비운다 (PRD 12장)
  const handleMarkAbsent = () => {
    if (!drawSession || pickedSeatIds.length === 0) return;
    const names = pickedNames();
    if (!window.confirm(`${names.join(', ')} 학생을 결석 처리할까요?\n명단에서 빠지고 자리는 비워져요.`)) {
      return;
    }
    const session = removeSeats(drawSession, pickedSeatIds);
    setDrawSession(session);
    // 전체 재추첨을 해도 학생 수와 좌석 수가 맞도록 명단과 좌석 선택에서도 뺀다
    setRawStudentText(session.students.map((st) => st.name).join('\n'));
    setSelectedSeatIds((prev) => prev.filter((id) => !pickedSet.has(id)));
    clearPicked();
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
    selectTemplate(BUS_TEMPLATES[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 이미지(PNG) 저장
  const handleSaveImage = async () => {
    if (!drawSession) return;
    try {
      await downloadResultImage(currentTemplate, drawSession);
    } catch (error) {
      alert(error instanceof Error ? error.message : '이미지 저장에 실패했습니다.');
    }
  };

  // 인쇄 (인쇄 창에서 "PDF로 저장"을 고르면 PDF가 된다)
  const handlePrint = () => {
    window.print();
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
            {allTemplates.map((template) => (
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
            <button
              type="button"
              className="bus-tab-button add-bus-tab"
              onClick={() => setIsEditingBus(true)}
              disabled={isDrawing || isEditingBus}
            >
              <span className="tab-icon">🛠️</span>
              <span className="tab-name">내 버스 만들기</span>
              <span className="tab-badge">+</span>
            </button>
          </div>
          {currentTemplate.isCustom && (
            <button
              type="button"
              className="delete-bus-btn"
              onClick={handleDeleteCustomBus}
              disabled={isDrawing}
            >
              🗑️ '{currentTemplate.name}' 삭제
            </button>
          )}
        </section>

        {isEditingBus && (
          <BusEditor
            baseTemplates={allTemplates}
            onSave={handleSaveCustomBus}
            onCancel={() => setIsEditingBus(false)}
          />
        )}

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
            {resultView === 'bus' && (
              <div className="partial-panel">
                {pickedSeatIds.length === 0 ? (
                  <span className="partial-guide">
                    💡 자리를 눌러 고르면 그 자리만 다시 추첨하거나 결석 처리할 수 있어요.
                  </span>
                ) : (
                  <>
                    <span className="partial-guide picked">
                      ✓ {pickedSeatIds.length}자리 고름: {pickedNames().join(', ')}
                    </span>
                    <div className="control-button-group">
                      <button
                        type="button"
                        className="ctrl-btn partial-btn"
                        onClick={handlePartialRedraw}
                        disabled={pickedSeatIds.length < 2}
                        title={pickedSeatIds.length < 2 ? '2자리 이상 골라 주세요' : undefined}
                      >
                        🔀 고른 자리끼리 다시 추첨
                      </button>
                      <button
                        type="button"
                        className="ctrl-btn deselect-all-btn"
                        onClick={handleMarkAbsent}
                      >
                        🚫 결석 처리
                      </button>
                      <button
                        type="button"
                        className="ctrl-btn home-btn"
                        onClick={clearPicked}
                      >
                        취소
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
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
            <div className="control-button-group">
              <button
                type="button"
                className="ctrl-btn save-btn"
                onClick={handleSaveImage}
              >
                🖼️ 이미지 저장
              </button>
              <button
                type="button"
                className="ctrl-btn save-btn"
                onClick={handlePrint}
              >
                🖨️ 인쇄 / PDF
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
              spinningSeatIds={spinningSeatIds}
              pickedSeatIds={pickedSet}
              onPickSeat={handlePickSeat}
            />
          )}
        </div>
      </main>

      {/* 인쇄 전용 배정표 (화면에는 보이지 않음) */}
      {drawSession && !isDrawing && (
        <PrintSheet template={currentTemplate} session={drawSession} />
      )}

      <footer className="app-footer">
        <p>체험학습 버스자리 PWA - Phase 9</p>
      </footer>
    </div>
  );
}

export default App;

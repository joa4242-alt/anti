import { useState, useMemo } from 'react';
import { BUS_TEMPLATES } from './data/busTemplates';
import { BusLayout } from './components/BusLayout';
import { StudentInput } from './components/StudentInput';
import { ValidationBanner } from './components/ValidationBanner';
import { parseStudentList } from './utils/studentSanitizer';
import { createDrawSession } from './utils/drawEngine';
import type { DrawSession } from './types/bus';
import './App.css';

function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('bus-45');
  const [rawStudentText, setRawStudentText] = useState<string>('');
  // 추첨 결과. 입력(버스/명단)이 바뀌면 무효화합니다.
  const [drawSession, setDrawSession] = useState<DrawSession | null>(null);

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
  const assignedNames = useMemo(() => {
    if (!drawSession) return undefined;
    const nameById = new Map(drawSession.students.map((s) => [s.id, s.name]));
    return new Map(
      drawSession.assignments.map((a) => [a.seatId, nameById.get(a.studentId) ?? ''])
    );
  }, [drawSession]);

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

  // 추첨 실행: 실제 결과를 먼저 생성해 보관 (연출은 Phase 6에서 추가)
  const handleStartDraw = () => {
    setDrawSession(
      createDrawSession(currentTemplate.id, parsedStudents, selectedSeatIds)
    );
  };

  // 결과를 닫고 좌석 선택 화면으로 복귀
  const handleResetDraw = () => {
    setDrawSession(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🚌 체험학습 버스자리</h1>
        <p className="app-subtitle">초등학교 체험학습용 버스 좌석 배치</p>
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

        {drawSession ? (
          /* 추첨 결과 툴바 */
          <section className="seat-control-toolbar">
            <span className="control-guide-text">
              🎉 학생 {drawSession.assignments.length}명의 자리 배정이 완료되었습니다.
            </span>
            <div className="control-button-group">
              <button
                type="button"
                className="ctrl-btn select-all-btn"
                onClick={handleStartDraw}
              >
                🔄 전체 재추첨
              </button>
              <button
                type="button"
                className="ctrl-btn deselect-all-btn"
                onClick={handleResetDraw}
              >
                ✏️ 좌석 다시 선택
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
        <BusLayout
          template={currentTemplate}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          assignedNames={assignedNames}
        />
      </main>

      <footer className="app-footer">
        <p>체험학습 버스자리 PWA - 랜덤 배정 연결 완료</p>
      </footer>
    </div>
  );
}

export default App;

import React from 'react';
import type { Student } from '../types/bus';
import { SAMPLE_STUDENTS_30 } from '../utils/studentSanitizer';
import './StudentInput.css';

interface StudentInputProps {
  rawText: string;
  students: Student[];
  onTextChange: (text: string) => void;
}

export const StudentInput: React.FC<StudentInputProps> = ({
  rawText,
  students,
  onTextChange,
}) => {
  const handleLoadSample = () => {
    onTextChange(SAMPLE_STUDENTS_30);
  };

  const handleClear = () => {
    onTextChange('');
  };

  // 동명이인 탐지
  const nameCounts = new Map<string, number>();
  students.forEach((s) => {
    nameCounts.set(s.name, (nameCounts.get(s.name) || 0) + 1);
  });
  const duplicateNames = Array.from(nameCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([name]) => name);

  return (
    <div className="student-input-container">
      <div className="student-input-header">
        <div className="title-area">
          <span className="section-icon">📝</span>
          <h2 className="section-title">학생 명단 입력</h2>
        </div>
        <div className="student-count-badge">
          <span className="count-label">총 학생 수</span>
          <span className="count-value">{students.length}명</span>
        </div>
      </div>

      <p className="student-input-guide">
        한 줄에 학생 1명씩 입력하거나 복사한 명단을 붙여넣으세요.
      </p>

      <div className="textarea-wrapper">
        <textarea
          className="student-textarea"
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`이름을 입력하세요 (예시):\n김민수\n이서준\n박지우`}
          rows={6}
          spellCheck={false}
        />
      </div>

      {/* 동명이인 안내 메세지 */}
      {duplicateNames.length > 0 && (
        <div className="duplicate-warning">
          <span>ℹ️ 동명이인 포함 ({duplicateNames.join(', ')}) - 각각 다른 학생으로 구분 관리됩니다.</span>
        </div>
      )}

      {/* 액션 버튼 그룹 */}
      <div className="student-action-toolbar">
        <button
          type="button"
          className="btn-sample-fill"
          onClick={handleLoadSample}
        >
          📋 샘플 30명 채우기
        </button>
        <button
          type="button"
          className="btn-text-clear"
          onClick={handleClear}
          disabled={!rawText}
        >
          🗑️ 명단 비우기
        </button>
      </div>
    </div>
  );
};

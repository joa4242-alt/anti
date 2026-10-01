import React, { useRef, useState } from 'react';
import type { Student } from '../types/bus';
import { SAMPLE_STUDENTS_30 } from '../utils/studentSanitizer';
import { readStudentNamesFromFile } from '../utils/importStudents';
import './StudentInput.css';

interface StudentInputProps {
  rawText: string;
  students: Student[];
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

export const StudentInput: React.FC<StudentInputProps> = ({
  rawText,
  students,
  onTextChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(
    null
  );

  // 엑셀/CSV 파일에서 명단 불러오기
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 동작하도록
    if (!file) return;

    try {
      const names = await readStudentNamesFromFile(file);
      if (names.length === 0) {
        setImportMessage({ type: 'error', text: '파일에서 학생 이름을 찾지 못했어요. 이름이 한 칸에 하나씩 있는지 확인해 주세요.' });
        return;
      }
      if (rawText.trim() && !window.confirm(`지금 입력된 명단을 '${file.name}'의 ${names.length}명으로 바꿀까요?`)) {
        return;
      }
      onTextChange(names.join('\n'));
      setImportMessage({ type: 'ok', text: `'${file.name}'에서 ${names.length}명을 불러왔어요. 아래 명단이 맞는지 확인해 주세요.` });
    } catch (error) {
      setImportMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '파일을 읽지 못했어요.',
      });
    }
  };

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
    .filter(([, count]) => count > 1)
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
          disabled={disabled}
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
          disabled={disabled}
        >
          📋 샘플 30명
        </button>
        <button
          type="button"
          className="btn-file-import"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          📂 엑셀 불러오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          onChange={handleFileChange}
          hidden
        />
        <button
          type="button"
          className="btn-text-clear"
          onClick={handleClear}
          disabled={disabled || !rawText}
        >
          🗑️ 비우기
        </button>
      </div>

      {importMessage && (
        <div className={`import-message ${importMessage.type}`} role="status">
          {importMessage.type === 'ok' ? '✅ ' : '⚠️ '}
          {importMessage.text}
        </div>
      )}
    </div>
  );
};

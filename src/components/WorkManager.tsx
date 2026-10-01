import React from 'react';
import type { SavedWork } from '../data/savedWorks';
import { formatDate } from '../utils/resultRows';
import './WorkManager.css';

interface WorkManagerProps {
  works: SavedWork[];
  currentWorkId: string;
  title: string;
  onTitleChange: (title: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClearAll: () => void;
  disabled?: boolean;
}

/**
 * 작업 이름 입력 + 저장된 작업(학급) 목록.
 * 작업은 자동 저장되며 이 기기 안에만 보관됩니다.
 */
export const WorkManager: React.FC<WorkManagerProps> = ({
  works,
  currentWorkId,
  title,
  onTitleChange,
  onLoad,
  onDelete,
  onNew,
  onClearAll,
  disabled = false,
}) => {
  const otherWorks = works.filter((w) => w.id !== currentWorkId);

  return (
    <section className="work-manager">
      <div className="work-title-row">
        <label className="work-title-label" htmlFor="work-title">
          📁 작업 이름
        </label>
        <input
          id="work-title"
          className="work-title-input"
          type="text"
          value={title}
          maxLength={30}
          placeholder="예: 5학년 2반 체험학습"
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled}
        />
        <button type="button" className="work-new-btn" onClick={onNew} disabled={disabled}>
          ＋ 새 작업
        </button>
      </div>
      <p className="work-autosave-note">💾 자동 저장 · 이 기기 안에만 보관돼요</p>

      {otherWorks.length > 0 && (
        <details className="work-list">
          <summary>저장된 작업 {otherWorks.length}개 보기</summary>
          <ul>
            {otherWorks.map((work) => (
              <li key={work.id} className="work-item">
                <button
                  type="button"
                  className="work-load-btn"
                  onClick={() => onLoad(work.id)}
                  disabled={disabled}
                >
                  <span className="work-item-title">{work.title || '이름 없는 작업'}</span>
                  <span className="work-item-meta">
                    {formatDate(work.updatedAt)} · {work.templateName} · 학생 {work.studentCount}명
                    {work.drawSession ? ' · ✅ 추첨 완료' : ''}
                  </span>
                </button>
                <button
                  type="button"
                  className="work-delete-btn"
                  onClick={() => onDelete(work.id)}
                  disabled={disabled}
                  aria-label={`${work.title || '이름 없는 작업'} 삭제`}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="work-clear-all-btn"
            onClick={onClearAll}
            disabled={disabled}
          >
            저장 기록 모두 지우기
          </button>
        </details>
      )}
    </section>
  );
};

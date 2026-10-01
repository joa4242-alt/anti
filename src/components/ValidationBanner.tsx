import React from 'react';
import './ValidationBanner.css';

interface ValidationBannerProps {
  studentCount: number;
  selectedSeatCount: number;
  onStartDraw: () => void;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({
  studentCount,
  selectedSeatCount,
  onStartDraw,
}) => {
  const isMatch = studentCount > 0 && studentCount === selectedSeatCount;

  const getValidationState = () => {
    if (studentCount === 0) {
      return {
        type: 'info',
        icon: '📝',
        message: '학생 명단을 입력해 주세요.',
        subMessage: '명단을 입력하거나 [엑셀 불러오기]·[샘플 30명] 버튼을 눌러주세요.',
      };
    }

    if (selectedSeatCount === 0) {
      return {
        type: 'info',
        icon: '🪑',
        message: '추첨할 좌석을 선택해 주세요.',
        subMessage: '버스 화면에서 좌석을 터치하거나 [전체 선택]을 누르세요.',
      };
    }

    if (studentCount > selectedSeatCount) {
      const diff = studentCount - selectedSeatCount;
      return {
        type: 'warning',
        icon: '⚠️',
        message: `좌석이 ${diff}석 부족합니다!`,
        subMessage: `학생 ${studentCount}명 / 선택 좌석 ${selectedSeatCount}석 ➔ 좌석 ${diff}개를 더 선택해 주세요.`,
      };
    }

    if (studentCount < selectedSeatCount) {
      const diff = selectedSeatCount - studentCount;
      return {
        type: 'warning',
        icon: '⚠️',
        message: `좌석이 ${diff}석 남습니다!`,
        subMessage: `학생 ${studentCount}명 / 선택 좌석 ${selectedSeatCount}석 ➔ 좌석 ${diff}개를 해제해 주세요.`,
      };
    }

    return {
      type: 'success',
      icon: '🎉',
      message: '추첨 준비가 완료되었습니다!',
      subMessage: `학생 ${studentCount}명과 선택 좌석 ${selectedSeatCount}석이 정확히 일치합니다.`,
    };
  };

  const status = getValidationState();

  return (
    <div className={`validation-banner ${status.type}`}>
      <div className="banner-content">
        <span className="banner-icon">{status.icon}</span>
        <div className="banner-text-group">
          <div className="banner-message">{status.message}</div>
          <div className="banner-submessage">{status.subMessage}</div>
        </div>
      </div>

      <button
        type="button"
        className={`draw-button ${isMatch ? 'active' : 'disabled'}`}
        disabled={!isMatch}
        onClick={onStartDraw}
      >
        <span className="draw-btn-icon">🎰</span>
        <span className="draw-btn-text">추첨 시작</span>
      </button>
    </div>
  );
};

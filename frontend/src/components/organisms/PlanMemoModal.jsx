import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../atoms/Button';
import './PlanMemoModal.css';

const PlanMemoModal = ({ isOpen, onClose, memo = '', onSave, placeName = '', dayTitle = '', position = { x: 0, y: 0 } }) => {
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  const [memoText, setMemoText] = useState(memo);

  // 모달이 열릴 때 메모 텍스트 초기화
  useEffect(() => {
    if (isOpen) {
      setMemoText(memo);
      // 모달이 열린 후 textarea에 포커스
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, memo]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      // DailyPlanCreate 모달 내부 클릭은 무시
      if (event.target.closest('.daily-plan-modal')) {
        return;
      }
      
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (onSave) {
      onSave(memoText);
    }
  };

  const handleCancel = () => {
    setMemoText(memo); // 원래 메모로 되돌리기
    onClose();
  };

  // 안전한 위치 계산
  const getSafePosition = () => {
    try {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const modalWidth = 350;
      const modalHeight = 350; // 높이를 더 크게 설정
      
      let x = position.x || 100;
      let y = position.y || 100;
      // 살짝 위쪽으로 띄우기 위한 오프셋
      const initialLift = 100; // px
      y -= initialLift;
      
      // 일정짜기 모달(DailyPlanCreate)의 경계 안에서 하단을 넘지 않도록 제한
      const dailyPlanEl = document.querySelector('.daily-plan-modal');
      const dailyPlanRect = dailyPlanEl ? dailyPlanEl.getBoundingClientRect() : null;
      if (dailyPlanRect) {
        const bottomLimit = dailyPlanRect.bottom - 63; // 여백을 늘려 조금 더 위에 배치
        const topLimit = dailyPlanRect.top + 20; // 상단도 너무 붙지 않도록 여백
        // 하단 제한: 메모 모달의 바닥이 일정짜기 모달의 바닥을 넘지 않게
        if (y + modalHeight > bottomLimit) {
          y = Math.max(topLimit, bottomLimit - modalHeight);
        }
        // 좌우는 기존 로직에서 처리
      }

      // 화면 밖으로 나가지 않도록 조정 (더 큰 여백 적용)
      x = Math.max(50, Math.min(screenWidth - modalWidth - 50, x));
      y = Math.max(50, Math.min(screenHeight - modalHeight - 50, y));
      
      // 추가 안전장치: 모달이 화면을 벗어나지 않도록 한 번 더 확인
      if (x + modalWidth > screenWidth - 30) {
        x = screenWidth - modalWidth - 30;
      }
      
      if (y + modalHeight > screenHeight - 30) {
        y = screenHeight - modalHeight - 30;
      }
      
      // 최소 위치 보장
      x = Math.max(50, x);
      y = Math.max(50, y);
      
      return { x, y };
    } catch (error) {
      console.error('위치 계산 오류:', error);
      return { x: 100, y: 100 };
    }
  };

  if (!isOpen) return null;

  const safePosition = getSafePosition();

  return (
    <div className="plan-memo-modal">
      <div 
        className="plan-memo-modal-content"
        ref={modalRef}
        style={{
          position: 'fixed',
          left: `${safePosition.x}px`,
          top: `${safePosition.y}px`,
          margin: 0
        }}
      >
        <div className="plan-memo-modal-header">
          <h3>메모 추가</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="plan-memo-modal-body">
          <div className="place-info">
            {dayTitle && (
              <p className="day-title">{dayTitle}</p>
            )}
            <p className="place-name">{placeName}</p>
          </div>
          
          <div className="memo-input-container">
            <textarea
              ref={textareaRef}
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="이 장소에 대한 메모를 입력하세요..."
              className="memo-textarea"
              rows={4}
              maxLength={200}
            />
            <div className="character-count">
              {memoText.length}/200
            </div>
          </div>
        </div>
        
        <div className="plan-memo-modal-footer">
          <Button 
            onClick={handleCancel} 
            background="white"
            textColor="black"
            border="gray"
            size="sm"
            shape="rounded"
          >
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            background="dark"
            textColor="white"
            size="sm"
            shape="rounded"
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanMemoModal;
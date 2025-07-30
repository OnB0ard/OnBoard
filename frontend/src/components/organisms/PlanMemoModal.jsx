import React, { useState, useRef, useEffect } from 'react';
import './PlanMemoModal.css';

const PlanMemoModal = ({ isOpen, onClose, memo = '', onSave, placeName = '' }) => {
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

  if (!isOpen) return null;

  return (
    <div className="plan-memo-modal">
      <div className="plan-memo-modal-content" ref={modalRef}>
        <div className="plan-memo-modal-header">
          <h3>메모 추가</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="plan-memo-modal-body">
          <div className="place-info">
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
          <button onClick={handleCancel} className="cancel-button">
            취소
          </button>
          <button onClick={handleSave} className="save-button">
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanMemoModal;
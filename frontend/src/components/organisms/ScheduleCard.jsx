import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ScheduleCard - 전체 일정 모달 등에서 사용하는 재사용 가능한 카드 컴포넌트
 * props:
 * - title: 카드 제목
 * - count: 하위 장소 개수 등 보조정보 숫자
 * - onClick: 카드 클릭 핸들러 (선택)
 * - className: 추가 클래스 (선택)
 * - style: 인라인 스타일 (선택)
 */
const ScheduleCard = ({ title, count, dayOrder, places = [], onClick, className = '', style }) => {
  const clickable = Boolean(onClick);
  const previews = Array.isArray(places) ? places : [];
  const [openMemoIndex, setOpenMemoIndex] = useState(null);
  const anchorElRef = useRef(null);
  const popoverElRef = useRef(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [popoverMaxHeight, setPopoverMaxHeight] = useState(undefined);

  const updatePopoverPosition = () => {
    const el = anchorElRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 10; // 버튼과 팝오버 간격
    let top = rect.bottom + gap;
    let left = rect.left;

    const maxWidth = 360;
    const minWidth = 240;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 모달 경계 계산 (.total-schedule-modal)
    const modalEl = el.closest('.total-schedule-modal');
    const modalRect = modalEl ? modalEl.getBoundingClientRect() : { top: 0, left: 0, right: vw, bottom: vh };
    const padding = 8;

    // 좌우 클램프: 모달 안에 머물도록
    if (left + maxWidth > modalRect.right - padding) {
      left = Math.max(modalRect.left + padding, modalRect.right - padding - maxWidth);
    }
    if (left < modalRect.left + padding) {
      left = modalRect.left + padding;
    }

    // 위/아래 가용 공간 계산
    const spaceBelow = modalRect.bottom - (rect.bottom + gap) - padding;
    const spaceAbove = (rect.top - gap) - modalRect.top - padding;

    // 기본은 아래에 띄우되, 아래 공간이 부족하고 위가 더 크면 위로 뒤집기
    let placeAbove = false;
    if (spaceBelow < 120 && spaceAbove > spaceBelow) {
      placeAbove = true;
    }

    if (placeAbove) {
      const maxH = Math.max(80, Math.floor(spaceAbove));
      setPopoverMaxHeight(maxH);
      // 위로 띄울 때는 팝오버 높이만큼 위로 이동
      top = Math.max(modalRect.top + padding, rect.top - gap - maxH);
    } else {
      const maxH = Math.max(80, Math.floor(spaceBelow));
      setPopoverMaxHeight(maxH);
      top = rect.bottom + gap;
    }

    // 모달 상단/하단 절대 클램프
    if (top < modalRect.top + padding) top = modalRect.top + padding;
    if (top > modalRect.bottom - padding) top = modalRect.bottom - padding;

    setPopoverPos({ top, left });
  };

  useEffect(() => {
    if (openMemoIndex === null) return;

    updatePopoverPosition();

    const handleScroll = () => updatePopoverPosition();
    const handleResize = () => updatePopoverPosition();
    const handleDocClick = (e) => {
      const anchor = anchorElRef.current;
      const popover = popoverElRef.current;
      if (!anchor || !popover) return setOpenMemoIndex(null);
      if (anchor.contains(e.target) || popover.contains(e.target)) return;
      setOpenMemoIndex(null);
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleDocClick);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleDocClick);
    };
  }, [openMemoIndex]);

  return (
    <div
      className={`total-schedule-card ${clickable ? 'clickable' : ''} ${openMemoIndex !== null ? 'popover-open' : ''} ${className}`.trim()}
      title={title}
      onClick={onClick}
      role={clickable ? 'button' : 'group'}
      tabIndex={clickable ? 0 : -1}
      aria-label={`${dayOrder ? `Day ${dayOrder}, ` : ''}${title}, 장소 ${count}개`}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={style}
    >
      <div className="card-header">
        <div className="card-title" title={title}>{title}</div>
        {typeof count === 'number' ? (
          <span className="chip-count" aria-label={`장소 총 ${count}개`} title={`장소 ${count}개`}>
            {count}개
          </span>
        ) : null}
      </div>

      <div className="card-body">
        <div className="preview-list">
          {previews.length === 0 ? (
            <div className="preview-empty">등록된 장소가 없습니다</div>
          ) : (
            previews.map((p, idx) => (
              <div className="preview-item" key={p.dayPlaceId || idx}>
                {p.imageUrl ? (
                  <img className="preview-thumb" src={p.imageUrl} alt="" loading="lazy" />
                ) : (
                  <div className="preview-thumb placeholder" />)
                }
                <div className="preview-texts">
                  <div className="preview-name" title={p.placeName}>{p.placeName}</div>
                  {p.memo ? (
                    <div className="preview-memo-wrapper">
                      <button
                        type="button"
                        className="preview-memo one-line"
                        title={p.memo}
                        aria-label="메모 보기"
                        aria-haspopup="dialog"
                        aria-expanded={openMemoIndex === idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          // 현재 버튼을 앵커로 저장하고 위치 계산
                          anchorElRef.current = e.currentTarget;
                          setOpenMemoIndex((prev) => (prev === idx ? null : idx));
                          // 위치는 effect에서 계산
                          // 다음 프레임에 한 번 더 보정 (레이아웃 확정 이후)
                          requestAnimationFrame(() => updatePopoverPosition());
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {p.memo && p.memo.length > 25 ? `${p.memo.slice(0, 25)}…` : p.memo}
                      </button>
                      {openMemoIndex === idx &&
                        createPortal(
                          (
                            <div
                              ref={popoverElRef}
                              className="memo-popover"
                              role="dialog"
                              aria-label="메모 내용"
                              style={{
                                position: 'fixed',
                                top: popoverPos.top,
                                left: popoverPos.left,
                                zIndex: 9999, // 어떤 오버레이보다도 충분히 높게
                                background: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
                                minWidth: 240,
                                maxWidth: 360,
                                maxHeight: popoverMaxHeight,
                                overflowY: 'auto',
                                outline: '1px solid rgba(99,102,241,0.15)',
                                margin: 0
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <div className="memo-popover-content">{p.memo}</div>
                            </div>
                          ),
                          document.body
                        )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;

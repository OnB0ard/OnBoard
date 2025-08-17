import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './TotalScheduleModal.css';
import ScheduleCard from '@/components/organisms/ScheduleCard';
import { getScheduleList } from '@/apis/scheduleList';

/**
 * 전체 일정 조회 모달
 * - 한 줄에 4개씩 카드 그리드로 표시
 * - scheduleList API를 통해 planId의 전체 일정을 조회
 */
const TotalScheduleModal = ({ isOpen, onClose, position, planId }) => {
  const modalRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (planId == null) throw new Error('planId is required');
        const res = await getScheduleList(planId);
        const planSchedule = res?.body?.planSchedule || [];
        if (!mounted) return;
        const mapped = [...planSchedule]
          .sort((a, b) => a.dayOrder - b.dayOrder)
          .map((d) => ({
            id: d.dayScheduleId,
            title: d.title || `Day ${d.dayOrder}`,
            count: Array.isArray(d.daySchedule) ? d.daySchedule.length : 0,
            dayOrder: d.dayOrder,
            places: Array.isArray(d.daySchedule) ? d.daySchedule : [],
          }));
        setItems(mapped);
      } catch (e) {
        console.error('[TotalScheduleModal] fetch failed:', e);
        setError(e?.message || '일정을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, planId]);

  // 바깥 클릭 시 닫기 (사이드바 클릭은 예외)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const modalEl = modalRef.current;
      if (!modalEl) return;
      // 사이드바 내부 클릭은 무시 (아이콘 토글과 레이스 방지)
      const sideBarEl = document.querySelector('.SideBar');
      if (sideBarEl && sideBarEl.contains(e.target)) return;
      if (!modalEl.contains(e.target)) {
        onClose?.();
      }
    };
    // click 단계에서 처리하여 버튼 onClick 후 닫힘이 적용되도록 함
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="total-schedule-modal"
      ref={modalRef}
      style={position ? { top: `${position.y}px`, left: `${position.x}px` } : {}}
    >
      <div className="total-schedule-header">
        <span>전체 일정 조회</span>
        <button
          type="button"
          className="total-schedule-close"
          aria-label="닫기"
          onClick={() => onClose?.()}
        >
          ✕
        </button>
      </div>
      <div className="total-schedule-body">
        {error && !loading && (
          <div className="total-schedule-empty error">{error}</div>
        )}
        {!loading && !error && (
          items.length > 0 ? (
            <div className="total-schedule-grid">
              {items.map((item) => (
                <ScheduleCard
                  key={item.id}
                  title={item.title}
                  count={item.count}
                  dayOrder={item.dayOrder}
                  places={item.places}
                />
              ))}
            </div>
          ) : (
            <div className="total-schedule-empty">등록된 일정이 없습니다.</div>
          )
        )}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default TotalScheduleModal;

import { useRef, useCallback, useEffect } from 'react';

/**
 * useAutoScroll
 * - 경계 근접 자동 스크롤 + 드래그 중 휠/트랙패드 스크롤
 *
 * @param {React.RefObject<HTMLElement>} scrollContainerRef
 * @param {{
 *   axis?: 'both'|'x'|'y',              // 스크롤 축 (기본 'y')
 *   enableWheel?: boolean,              // 휠 처리 on/off (기본 true)
 *   wheelOnlyWhileDragging?: boolean,   // 드래그 중일 때만 휠 가로채기 (기본 true)
 *   listenWindow?: boolean              // 커서가 컨테이너 밖으로 나가도 유지 (기본 true)
 * }=} options
 * @returns {{ startAutoScroll: Function, stopAutoScroll: Function, handleAutoScroll: Function }}
 */
export function useAutoScroll(
  scrollContainerRef,
  { axis = 'y', enableWheel = true, wheelOnlyWhileDragging = true, listenWindow = true } = {}
) {
  const autoScrollIntervalRef = useRef(null);

  // === 기존: 경계 근접 자동 스크롤 ===
  const startAutoScroll = useCallback((direction, speed = 1) => {
    if (autoScrollIntervalRef.current) return; // 이미 스크롤 중이면 무시
    autoScrollIntervalRef.current = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const base = 5 * speed;
      const dy = direction === 'up' ? -base : base;
      container.scrollTop += dy;
    }, 16); // ~60fps
  }, [scrollContainerRef]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  const handleAutoScroll = useCallback((e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY;
    const scrollZone = 50; // 상/하단 50px

    if (mouseY < rect.top + scrollZone) {
      const distance = rect.top + scrollZone - mouseY;
      const speed = Math.min(distance / scrollZone, 1);
      startAutoScroll('up', speed);
    } else if (mouseY > rect.bottom - scrollZone) {
      const distance = mouseY - (rect.bottom - scrollZone);
      const speed = Math.min(distance / scrollZone, 1);
      startAutoScroll('down', speed);
    } else {
      stopAutoScroll();
    }
  }, [scrollContainerRef, startAutoScroll, stopAutoScroll]);

  // === 추가: 드래그 중 휠 스크롤 ===
  const isDraggingRef = useRef(false);
  const tickingRef = useRef(false);

  // 전역 드래그 상태 감지 (컴포넌트 수정 불필요)
  useEffect(() => {
    const onDragStart = () => { isDraggingRef.current = true; };
    const onDragEnd = () => { isDraggingRef.current = false; stopAutoScroll(); };

    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('dragend', onDragEnd);
    document.addEventListener('drop', onDragEnd);

    return () => {
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('dragend', onDragEnd);
      document.removeEventListener('drop', onDragEnd);
    };
  }, [stopAutoScroll]);

  useEffect(() => {
    if (!enableWheel) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      // 드래그 중일 때만 휠 가로채기
      if (wheelOnlyWhileDragging && !isDraggingRef.current) return;

      // 자동 스크롤 동작 중이면 끔 (충돌 방지)
      stopAutoScroll();

      // 확대/축소(CTRL+휠)는 그대로 두고, 나머지는 페이지 스크롤 방지
      if (!e.ctrlKey) e.preventDefault();

      if (tickingRef.current) return;
      tickingRef.current = true;

      const dx = axis !== 'y' ? e.deltaX : 0;
      const dy = axis !== 'x' ? e.deltaY : 0;

      requestAnimationFrame(() => {
        container.scrollBy({ left: dx, top: dy, behavior: 'auto' });
        tickingRef.current = false;
      });
    };

    // 컨테이너에 우선 등록
    container.addEventListener('wheel', onWheel, { passive: false });
    // 커서가 살짝 벗어나도 동작 유지
    if (listenWindow) window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
      if (listenWindow) window.removeEventListener('wheel', onWheel);
    };
  }, [scrollContainerRef, axis, enableWheel, wheelOnlyWhileDragging, listenWindow, stopAutoScroll]);

  // 언마운트 시 인터벌 정리
  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  return { startAutoScroll, stopAutoScroll, handleAutoScroll };
}

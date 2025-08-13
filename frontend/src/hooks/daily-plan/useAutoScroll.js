import { useRef, useCallback, useEffect } from 'react';

/**
 * useAutoScroll
 * - 스크롤 컨테이너 ref를 받아, 드래그 중 마우스가 상/하단 가까이 가면 자동 스크롤합니다.
 * - 60fps(setInterval 16ms) 기반으로 부드럽게 스크롤합니다.
 *
 * @param {React.RefObject<HTMLElement>} scrollContainerRef
 * @returns {{ startAutoScroll: Function, stopAutoScroll: Function, handleAutoScroll: Function }}
 */
export function useAutoScroll(scrollContainerRef) {
  const autoScrollIntervalRef = useRef(null);

  const startAutoScroll = useCallback((direction, speed = 1) => {
    if (autoScrollIntervalRef.current) return; // 이미 스크롤 중이면 무시

    autoScrollIntervalRef.current = setInterval(() => { 
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollAmount = direction === 'up' ? -5 * speed : 5 * speed;
      container.scrollTop += scrollAmount;
    }, 16); // 60fps
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

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  return { startAutoScroll, stopAutoScroll, handleAutoScroll };
}

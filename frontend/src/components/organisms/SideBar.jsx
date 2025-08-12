import React, { useEffect, useRef, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import Icon from "../atoms/Icon";
import AutocompleteSearchModal from "./AutocompleteSearchModal";
import Bookmark from "./Bookmark";
import DailyPlanCreate1 from "./DailyPlanCreate1";

import { useMapCoreStore, useBookmarkStore, usePlaceDetailsStore } from "../../store/mapStore";
import useDailyPlanStore from "../../store/useDailyPlanStore";
import { getScheduleList } from "@/apis/scheduleList";
import "./SideBar.css";

const SideBar = ({ onDailyPlanModalToggle, planId }) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const isMapVisible = useMapCoreStore((state) => state.isMapVisible);
  const setIsMapVisible = useMapCoreStore((state) => state.setIsMapVisible);

  const bookmarkedPlaces = useBookmarkStore((state) => state.bookmarkedPlaces);
  const openPlaceDetailByPlaceId = usePlaceDetailsStore((s) => s.openPlaceDetailByPlaceId);
  const openPlaceDetailFromCandidate = usePlaceDetailsStore((s) => s.openPlaceDetailFromCandidate);
  const setDailyPlans = useDailyPlanStore((s) => s.setDailyPlans);
  const loadedPlanIdRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleSearchClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({ x: rect.right + 15, y: 75 });
    setIsSearchModalOpen(!isSearchModalOpen);
    // 다른 모달들 닫기
    setIsBookmarkModalOpen(false);
    if (isDailyPlanModalOpen && onDailyPlanModalToggle) {
      onDailyPlanModalToggle(false);
    }
    setIsDailyPlanModalOpen(false);
  };

  const handleBookmarkPlaceClick = async (place) => {
    try {
      // 다양한 키 케이스 지원
      const pid = place.placeId || place.googlePlaceId || place.place_id || place.id;
      if (pid) {
        await openPlaceDetailByPlaceId(pid, true, 'center');
      } else {
        await openPlaceDetailFromCandidate(place, true, 'center');
      }
    } catch (err) {
      console.error('[SideBar] open detail from bookmark failed:', err);
    }
  };

  const handleBookmarkClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({ x: rect.right + 15, y: 75 });
    setIsBookmarkModalOpen(!isBookmarkModalOpen);
    // 다른 모달들 닫기
    setIsSearchModalOpen(false);
    if (isDailyPlanModalOpen && onDailyPlanModalToggle) {
      onDailyPlanModalToggle(false);
    }
    setIsDailyPlanModalOpen(false);
  };

  const handleDailyPlanClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({ x: rect.right + 15, y: 75 }); // y좌표를 75px로 고정
    setIsDailyPlanModalOpen(!isDailyPlanModalOpen);
    // 다른 모달들 닫기
    setIsSearchModalOpen(false);
    setIsBookmarkModalOpen(false);
    // 부모 컴포넌트에 모달 상태 전달
    if (onDailyPlanModalToggle) {
      onDailyPlanModalToggle(!isDailyPlanModalOpen);
    }
  };

  const handleMapClick = () => {
    setIsMapVisible(!isMapVisible);
  };

  // 일정 모달을 처음 열 때 해당 planId의 전체 일정을 1회 로드
  useEffect(() => {
    const shouldLoad = isDailyPlanModalOpen && planId != null && loadedPlanIdRef.current !== planId;
    if (!shouldLoad) return;
    (async () => {
      try {
        console.log('[SideBar] Fetch schedule list for planId', planId);
        const res = await getScheduleList(planId);
        const planSchedule = res?.body?.planSchedule || [];
        const mapped = [...planSchedule]
          .sort((a, b) => (a.dayOrder || 0) - (b.dayOrder || 0))
          .map((d) => ({
            id: d.dayScheduleId,
            title: d.title,
            places: (Array.isArray(d.daySchedule) ? d.daySchedule : [])
              .sort((a, b) => (a.indexOrder || 0) - (b.indexOrder || 0))
              .map((p) => ({
                id: p.dayPlaceId,
                name: p.placeName,
                displayName: p.placeName,
                address: p.address,
                formatted_address: p.address,
                latitude: p.latitude,
                longitude: p.longitude,
                rating: p.rating,
                ratingCount: p.ratingCount,
                imageUrl: p.imageUrl,
                memo: p.memo || '',
                placeId: p.placeId,
                googlePlaceId: p.googlePlaceId,
                indexOrder: p.indexOrder,
              })),
          }));
        setDailyPlans(mapped);
        loadedPlanIdRef.current = planId;
      } catch (e) {
        console.error('[SideBar] Failed to load schedule list:', e);
      }
    })();
  }, [isDailyPlanModalOpen, planId, setDailyPlans]);

  return (
    <>
      {/* 사이드바 */}
      <div className="SideBar">
        {/* 검색 아이콘 */}
        <button
          onClick={(e) => handleSearchClick(e)}
          className={`sidebar-icon ${isSearchModalOpen ? 'active' : ''}`}
          title="장소 검색"
        >
          <Icon type="search" />
        </button>

        {/* 북마크 아이콘 */}
        <button
          onClick={(e) => handleBookmarkClick(e)}
          className={`sidebar-icon ${isBookmarkModalOpen ? 'active' : ''}`}
          title="북마크"
        >
          <Icon type="bookmark" />
        </button>

        {/* 추가 아이콘 */}
        <button
          onClick={(e) => handleDailyPlanClick(e)}
          className={`sidebar-icon ${isDailyPlanModalOpen ? 'active' : ''}`}
          title="일정 추가"
        >
          <Icon type="plus" />
        </button>

        {/* 지도 아이콘 */}
        <button 
          onClick={handleMapClick}
          className={`sidebar-icon ${isMapVisible ? 'active' : ''}`}
          title={isMapVisible ? "지도 닫기" : "지도 열기"}
        >
          <Icon type="map" />
        </button>
      </div>

      {/* 검색 모달 */}
      <APIProvider apiKey={apiKey}>
        <AutocompleteSearchModal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)}
          position={modalPosition}
        />
        {/* 북마크 모달 */}
      <Bookmark 
        isOpen={isBookmarkModalOpen} 
        onClose={() => setIsBookmarkModalOpen(false)}
        onPlaceClick={handleBookmarkPlaceClick}
        bookmarkedPlaces={bookmarkedPlaces}
        position={modalPosition}
        planId={planId}
      />
      </APIProvider>

      {/* 일정 추가 모달 */}
      <DailyPlanCreate1 
        isOpen={isDailyPlanModalOpen} 
        position={modalPosition}
        onClose={() => {
          setIsDailyPlanModalOpen(false);
          // 부모 컴포넌트에 모달 상태 전달
          if (onDailyPlanModalToggle) {
            onDailyPlanModalToggle(false);
          }
        }}
        bookmarkedPlaces={bookmarkedPlaces}
        planId={planId}
      />
    </>
  );
};

export default SideBar;
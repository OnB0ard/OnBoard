import React, { useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import Icon from "../atoms/Icon";
import AutocompleteSearchModal from "./AutocompleteSearchModal";
import Bookmark from "./Bookmark";
import DailyPlanCreate from "./DailyPlanCreate";
import useMapStore from "../../store/useMapStore";
import "./SideBar.css";

const SideBar = ({ onDailyPlanModalToggle }) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const isMapVisible = useMapStore((state) => state.isMapVisible);
  const setIsMapVisible = useMapStore((state) => state.setIsMapVisible);
  const bookmarkedPlaces = useMapStore((state) => state.bookmarkedPlaces);

  const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k';

  const handleSearchClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({ x: rect.right + 15, y: 75 });
    setIsSearchModalOpen(!isSearchModalOpen);
    setIsDailyPlanModalOpen(false);
  };

  const handleBookmarkClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({ x: rect.right + 15, y: 75 });
    setIsBookmarkModalOpen(true);
    setIsDailyPlanModalOpen(false);
  };

  const handleDailyPlanClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setModalPosition({ x: rect.right + 15, y: 75 }); // y좌표를 75px로 고정
    setIsDailyPlanModalOpen(true);
    // 부모 컴포넌트에 모달 상태 전달
    if (onDailyPlanModalToggle) {
      onDailyPlanModalToggle(true);
    }
  };

  const handleMapClick = () => {
    setIsMapVisible(!isMapVisible);
    setIsDailyPlanModalOpen(false);
  };

  return (
    <>
      {/* 사이드바 */}
      <div className="SideBar">
        {/* 검색 아이콘 */}
        <button
          onClick={(e) => handleSearchClick(e)}
          className="sidebar-icon"
          title="장소 검색"
        >
          <Icon type="search" />
        </button>

        {/* 북마크 아이콘 */}
        <button
          onClick={(e) => handleBookmarkClick(e)}
          className="sidebar-icon"
          title="북마크"
        >
          <Icon type="bookmark" />
        </button>

        {/* 추가 아이콘 */}
        <button
          onClick={(e) => handleDailyPlanClick(e)}
          className="sidebar-icon"
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
        bookmarkedPlaces={bookmarkedPlaces}
        position={modalPosition}
      />
      </APIProvider>

      {/* 일정 추가 모달 */}
      <DailyPlanCreate 
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
      />
    </>
  );
};

export default SideBar;
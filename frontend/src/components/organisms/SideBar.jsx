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
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState([]);
  const { isMapVisible, setIsMapVisible } = useMapStore();

  const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k';

  const handleSearchClick = () => {
    setIsSearchModalOpen(!isSearchModalOpen);
  };

  const handleBookmarkClick = () => {
    setIsBookmarkModalOpen(true);
  };

  const handleDailyPlanClick = () => {
    setIsDailyPlanModalOpen(true);
    // 부모 컴포넌트에 모달 상태 전달
    if (onDailyPlanModalToggle) {
      onDailyPlanModalToggle(true);
    }
  };

  const handleMapClick = () => {
    setIsMapVisible(!isMapVisible);
  };

  return (
    <>
      {/* 사이드바 */}
      <div className="SideBar">
        {/* 검색 아이콘 */}
        <button
          onClick={handleSearchClick}
          className="sidebar-icon"
          title="장소 검색"
        >
          <Icon type="search" />
        </button>

        {/* 북마크 아이콘 */}
        <button
          onClick={handleBookmarkClick}
          className="sidebar-icon"
          title="북마크"
        >
          <Icon type="bookmark" />
        </button>

        {/* 추가 아이콘 */}
        <button
          onClick={handleDailyPlanClick}
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
        />
        {/* 북마크 모달 */}
      <Bookmark 
        isOpen={isBookmarkModalOpen} 
        onClose={() => setIsBookmarkModalOpen(false)}
        bookmarkedPlaces={bookmarkedPlaces}
      />
      </APIProvider>

      {/* 일정 추가 모달 */}
      <DailyPlanCreate 
        isOpen={isDailyPlanModalOpen} 
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
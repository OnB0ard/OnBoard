import React, { useState } from "react";
import Icon from "../atoms/Icon";
import SearchPlace from "./SearchPlace";
import Bookmark from "./Bookmark";
import DailyPlanCreate from "./DailyPlanCreate";
import "./SideBar.css";

const SideBar = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);

  const handleSearchClick = () => {
    setIsSearchModalOpen(!isSearchModalOpen);
  };

  const handleBookmarkClick = () => {
    setIsBookmarkModalOpen(true);
  };

  const handleDailyPlanClick = () => {
    setIsDailyPlanModalOpen(true);
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
      </div>

      {/* 검색 모달 */}
      <SearchPlace 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />

      {/* 북마크 모달 */}
      <Bookmark 
        isOpen={isBookmarkModalOpen} 
        onClose={() => setIsBookmarkModalOpen(false)} 
      />

      {/* 일정 추가 모달 */}
      <DailyPlanCreate 
        isOpen={isDailyPlanModalOpen} 
        onClose={() => setIsDailyPlanModalOpen(false)} 
      />
    </>
  );
};

export default SideBar;
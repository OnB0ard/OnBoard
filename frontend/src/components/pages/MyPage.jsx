import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../atoms/Button";
import Icon from "../atoms/Icon";
import SettingModal from "../organisms/SettingModal";
import "./MyPage.css";
import Card from "../organisms/Card";
import { useAuthStore } from "../../store/useAuthStore";
import { getPlanList } from "../../apis/planList";
import { deletePlan } from "../../apis/planDelete";
 


const MyPage = () => {
  const navigate = useNavigate();
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ongoing"); // 'ongoing' | 'completed'
  const [ongoingPlans, setOngoingPlans] = useState([]);
  const [completedPlans, setCompletedPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnyPopoverOpen, setIsAnyPopoverOpen] = useState(false);
  const [ongoingCurrentPage, setOngoingCurrentPage] = useState(0);
  const [completedCurrentPage, setCompletedCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('none'); // 'left', 'right', 'none'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // zustand store 구독: 프로필 렌더링은 스토어 상태를 단일 소스로 사용
  const userName = useAuthStore((s) => s.userName);
  const profileImage = useAuthStore((s) => s.profileImage);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  // 프로필 이미지 URL (스토어 기반)
  const displayProfileImage = profileImage || "/images/profile_default.png";

  // 화면 크기별 카드 개수 계산 함수
  const getCardsPerPage = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width >= 1280) return 4; // xl: 4개
    if (width >= 1024) return 3; // lg: 3개
    if (width >= 768) return 2;  // md: 2개
    return 1; // sm: 1개
  };

  const [cardsPerPage, setCardsPerPage] = useState(getCardsPerPage());

  // 여행 계획을 진행 중/완료로 분류하는 함수
  const classifyPlans = (plans) => {
    const today = new Date(new Date().toISOString().split('T')[0]);
    
    const ongoing = [];
    const completed = [];
    
    plans.forEach(plan => {
      if (plan.endDate && new Date(plan.endDate) < today) {
        completed.push(plan);
      } else {
        ongoing.push(plan);
      }
    });
    
    return { ongoing, completed };
  };

  // 시간순 정렬 (최신순)
  const sortByTime = (plans) => {
    return [...plans].sort((a, b) => b.planId - a.planId);
  };

  // 여행 계획 목록 조회
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const planData = await getPlanList();
      
      // 진행 중/완료로 분류
      const { ongoing, completed } = classifyPlans(planData || []);
      
      // 시간순으로 정렬
      setOngoingPlans(sortByTime(ongoing));
      setCompletedPlans(sortByTime(completed));

    } catch (error) {
      console.error('여행 계획 목록 조회 실패:', error);
      setOngoingPlans([]);
      setCompletedPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      const newCardsPerPage = getCardsPerPage();
      if (newCardsPerPage !== cardsPerPage) {
        setCardsPerPage(newCardsPerPage);
        // 페이지 초기화
        setOngoingCurrentPage(0);
        setCompletedCurrentPage(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cardsPerPage]);

  // 카드 클릭 핸들러
  const handleCardClick = (planData) => {
    navigate(`/plan/${planData.planId}`);
  };

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = (planData) => {
    setDeleteTarget(planData);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    try {
      await deletePlan(deleteTarget.planId);
      await fetchPlans(); // 삭제 후 목록 새로고침
    } catch (error) {
      alert('계획 삭제에 실패했습니다.');
      console.error('계획 삭제 실패:', error);
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleSettingClick = () => {
    setIsSettingModalOpen(true);
  };

  const handleCloseSettingModal = () => {
    setIsSettingModalOpen(false);
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // 탭 변경 시 페이지 초기화
    setOngoingCurrentPage(0);
    setCompletedCurrentPage(0);
  };

  // 페이지네이션 관련 함수들
  const getCurrentPagePlans = (plans, currentPage) => {
    const startIndex = currentPage * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return plans.slice(startIndex, endIndex);
  };

  const getTotalPages = (plans) => {
    return Math.ceil(plans.length / cardsPerPage);
  };

  const handlePrevPage = (type) => {
    if (isAnimating) return;
    
    setSlideDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      if (type === 'ongoing') {
        setOngoingCurrentPage(prev => Math.max(0, prev - 1));
      } else {
        setCompletedCurrentPage(prev => Math.max(0, prev - 1));
      }
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection('none');
      }, 30);
    }, 120);
  };

  const handleNextPage = (type) => {
    if (isAnimating) return;
    
    setSlideDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      if (type === 'ongoing') {
        const totalPages = getTotalPages(ongoingPlans);
        setOngoingCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
      } else {
        const totalPages = getTotalPages(completedPlans);
        setCompletedCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
      }
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection('none');
      }, 30);
    }, 120);
  };

  const handlePageClick = (type, pageIndex) => {
    if (isAnimating) return;
    
    // 현재 페이지와 클릭한 페이지를 비교해서 방향 결정
    const currentPage = type === 'ongoing' ? ongoingCurrentPage : completedCurrentPage;
    const direction = pageIndex > currentPage ? 'left' : 'right';
    
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      if (type === 'ongoing') {
        setOngoingCurrentPage(pageIndex);
      } else {
        setCompletedCurrentPage(pageIndex);
      }
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection('none');
      }, 30);
    }, 120);
  };

  return (
    <>
      <div className="mypage-container">
        <div className="mypage-content fade-in">
          {/* 프로필 섹션 */}
          <div className="profile-section">
            {/* 프로필 이미지 */}
            <div className="profile-image-container">
              <Avatar className="w-50 h-50">
                <AvatarImage 
                  key={displayProfileImage}
                  src={displayProfileImage}
                  alt="Profile"
                  onError={(e) => {
                    const fallback = '/images/profile_default.png';
                    if (e.currentTarget.src.indexOf(fallback) === -1) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
            
            {/* 사용자 이름과 설정 버튼 */}
            <div className="profile-name-section">
              <h1 className="profile-name">
                {(userName || "사용자")} 님
              </h1>
              <button
                onClick={handleSettingClick}
                className="settings-button"
              >
                <Icon type="setting" />
              </button>
            </div>
          </div>

          {/* 탭 섹션 */}
          <div className="tabs-container slide-up">
            <div className="tabs-wrapper">
              <button 
                className={`tab-button ${activeTab === "ongoing" ? "active" : ""}`}
                onClick={() => handleTabChange("ongoing")}
              >
                계획중인 여행
                <span className="tab-count-badge">
                  {ongoingPlans.length}
                </span>
              </button>
              <button 
                className={`tab-button ${activeTab === "completed" ? "active" : ""}`}
                onClick={() => handleTabChange("completed")}
              >
                완료된 여행
                <span className="tab-count-badge">
                  {completedPlans.length}
                </span>
              </button>
            </div>
          </div>

          {/* 카드 리스트 섹션 */}
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-text">로딩 중...</div>
            </div>
          ) : (
            <div className="cards-section">
              {activeTab === "ongoing" ? (
                <div>
                  {ongoingPlans.length === 0 ? (
                    <div className="empty-state">
                      계획중인 여행이 없습니다.
                    </div>
                  ) : (
                    <>
                                             {/* 카드 그리드 */}
                       <div className={`cards-grid ${
                         isAnimating 
                           ? slideDirection === 'left' ? 'slide-left' : 'slide-right'
                           : 'slide-in'
                       }`}>
                         {getCurrentPagePlans(ongoingPlans, ongoingCurrentPage).map((plan) => (
                          <div key={plan.planId} className="card-hover-effect">
                            <Card
                              planData={plan}
                              onView={() => handleCardClick(plan)}
                              onEdit={() => {}} // 마이페이지에서는 수정 기능 제외
                              onDelete={() => handleDeleteClick(plan)}
                              isAnyPopoverOpen={isAnyPopoverOpen}
                              onPopoverOpenChange={setIsAnyPopoverOpen}
                              hideDropdown={true}
                              hideManageActions={true}
                            />
                          </div>
                        ))}
                      </div>
                      
                      {/* 페이지네이션 */}
                      {getTotalPages(ongoingPlans) > 1 && (
                        <div className="pagination-container">
                          <button
                            onClick={() => handlePrevPage('ongoing')}
                            disabled={ongoingCurrentPage === 0}
                            className={`pagination-button ongoing ${ongoingCurrentPage === 0 ? '' : ''}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <div className="pagination-dots">
                                                         {[...Array(getTotalPages(ongoingPlans))].map((_, index) => (
                               <button
                                 key={index}
                                 onClick={() => handlePageClick('ongoing', index)}
                                 className={`pagination-dot ongoing ${index === ongoingCurrentPage ? 'active' : ''}`}
                               />
                             ))}
                          </div>
                          
                          <button
                            onClick={() => handleNextPage('ongoing')}
                            disabled={ongoingCurrentPage === getTotalPages(ongoingPlans) - 1}
                            className={`pagination-button ongoing ${ongoingCurrentPage === getTotalPages(ongoingPlans) - 1 ? '' : ''}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {completedPlans.length === 0 ? (
                    <div className="empty-state">
                      완료된 여행이 없습니다.
                    </div>
                  ) : (
                    <>
                                             {/* 카드 그리드 */}
                       <div className={`cards-grid ${
                         isAnimating 
                           ? slideDirection === 'left' ? 'slide-left' : 'slide-right'
                           : 'slide-in'
                       }`}>
                         {getCurrentPagePlans(completedPlans, completedCurrentPage).map((plan) => (
                          <div key={plan.planId} className="card-hover-effect">
                            <Card
                              planData={plan}
                              onView={() => handleCardClick(plan)}
                              onEdit={() => {}} // 마이페이지에서는 수정 기능 제외
                              onDelete={() => handleDeleteClick(plan)}
                              isAnyPopoverOpen={isAnyPopoverOpen}
                              onPopoverOpenChange={setIsAnyPopoverOpen}
                              hideDropdown={true}
                              hideManageActions={true}
                            />
                          </div>
                        ))}
                      </div>
                      
                      {/* 페이지네이션 */}
                      {getTotalPages(completedPlans) > 1 && (
                        <div className="pagination-container">
                          <button
                            onClick={() => handlePrevPage('completed')}
                            disabled={completedCurrentPage === 0}
                            className={`pagination-button completed ${completedCurrentPage === 0 ? '' : ''}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <div className="pagination-dots">
                             {[...Array(getTotalPages(completedPlans))].map((_, index) => (
                               <button
                                 key={index}
                                 onClick={() => handlePageClick('completed', index)}
                                 className={`pagination-dot completed ${index === completedCurrentPage ? 'active' : ''}`}
                               />
                             ))}
                          </div>
                          
                          <button
                            onClick={() => handleNextPage('completed')}
                            disabled={completedCurrentPage === getTotalPages(completedPlans) - 1}
                            className={`pagination-button completed ${completedCurrentPage === getTotalPages(completedPlans) - 1 ? '' : ''}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 설정 모달 */}
      <SettingModal 
        isOpen={isSettingModalOpen} 
        onClose={handleCloseSettingModal} 
      />

      {/* 삭제 확인 모달 */}
      {showDeleteModal && deleteTarget && (
        <div className="delete-modal__backdrop">
          <div className="delete-modal">
            <div className="delete-modal__header">
              <div className="delete-modal__icon">
                <Icon type="sign-out" />
              </div>
              <h2 className="delete-modal__title">계획 삭제</h2>
            </div>
            
            <div className="delete-modal__content">
              <p className="delete-modal__message">
                '{deleteTarget.name}' 계획을 정말 삭제하시겠습니까?
              </p>
              <p className="delete-modal__submessage">
                삭제된 계획은 복구할 수 없습니다.
              </p>
            </div>

            <div className="delete-modal__footer">
              <Button 
                background="white"
                textColor="black"
                border="gray"
                onClick={handleDeleteCancel}
              >
                취소
              </Button>
              <Button 
                background="red"
                textColor="white"
                onClick={handleDeleteConfirm}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyPage;
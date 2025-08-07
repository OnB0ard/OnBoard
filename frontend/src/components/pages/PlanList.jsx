import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../organisms/Card";
import PlanAddCard from "../organisms/PlanAddCard";
import PlanPostModal from "../organisms/PlanPostModal";
import LoadingOverlay from "../atoms/LoadingOverlay";
import { getPlanList } from "../../apis/planList";
import { deletePlan } from "../../apis/planDelete";
import { createPlan } from "../../apis/planCreate";
import { updatePlan } from "../../apis/planUpdate";

// 정렬 함수
const sortPlans = (plans, type) => {
  const sortedPlans = [...plans];
  
  if (type === 'created') {
    // 생성순: planId 기준으로 내림차순 (늦게 생성된 것부터)
    return sortedPlans.sort((a, b) => b.planId - a.planId);
  } else if (type === 'date') {
    // 날짜순: startDate 기준으로 오름차순 (빠른 날짜부터)
    return sortedPlans.sort((a, b) => {
      const dateA = new Date(a.startDate || '9999-12-31');
      const dateB = new Date(b.startDate || '9999-12-31');
      return dateA - dateB;
    });
  }
  
  return sortedPlans;
};

// 완료된 여행을 날짜순으로 정렬하는 함수
const sortCompletedPlans = (plans) => {
  const sortedPlans = [...plans];
  return sortedPlans.sort((a, b) => {
    const dateA = new Date(a.startDate || '9999-12-31');
    const dateB = new Date(b.startDate || '9999-12-31');
    return dateA - dateB;
  });
};

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

const PlanList = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // "계획중인 여행"과 "완료된 여행"을 위한 상태를 분리
  const [ongoingPlans, setOngoingPlans] = useState([]);
  const [completedPlans, setCompletedPlans] = useState([]);

  // 팝오버가 하나라도 열려있는지 관리하는 상태
  const [isAnyPopoverOpen, setIsAnyPopoverOpen] = useState(false);
  
  // 정렬 상태 관리
  const [sortType, setSortType] = useState('created'); // 'created' | 'date'
  const [isSorting, setIsSorting] = useState(false); // 정렬 중 로딩 상태

  // 여행 계획 목록 조회
  const fetchPlans = useCallback(async () => {
    setIsPageLoading(true);
    try {
      const planData = await getPlanList();
      const { ongoing, completed } = classifyPlans(planData || []);
      
      // 데이터를 가져온 후 정렬하여 상태에 저장
      setOngoingPlans(sortPlans(ongoing, sortType));
      setCompletedPlans(sortCompletedPlans(completed));

    } catch (error) {
      console.error('여행 계획 목록 조회 실패:', error);
      setOngoingPlans([]);
      setCompletedPlans([]);
    } finally {
      setIsPageLoading(false);
    }
  // sortType을 의존성에 추가하여 초기 정렬을 보장하되, fetchPlans 자체는 마운트 시 한 번만 호출되도록 관리합니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 정렬만 변경하는 함수 (API 호출 없이)
  const applySorting = useCallback(() => {
    setOngoingPlans(prevOngoing => sortPlans(prevOngoing, sortType));
  }, [sortType]);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 컴포넌트 마운트 시에만 실행

  // sortType이 변경될 때는 정렬만 적용
  useEffect(() => {
    if (ongoingPlans.length > 0) {
      applySorting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortType, applySorting]);

  // 카드 클릭 핸들러
  const handleCardClick = (planData) => {
    navigate(`/plan/${planData.planId}`);
  };

  // 수정 버튼 클릭 핸들러
  const handleEditClick = (planData) => {
    setEditingPlan(planData);
    setIsEditModalOpen(true);
  };

  // 나가기 성공 핸들러
  const handleLeave = () => {
    // 목록을 다시 불러와 나간 계획을 반영
    fetchPlans();
  };

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = async (planData) => {
    if (window.confirm(`'${planData.name}' 계획을 정말 삭제하시겠습니까?`)) {
      setIsLoading(true);
      try {
        await deletePlan(planData.planId);
        await fetchPlans(); // 삭제 후 목록 새로고침
      } catch (error) {
        alert('계획 삭제에 실패했습니다.');
        console.error('계획 삭제 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 정렬 변경 핸들러
  const handleSortChange = (newSortType) => {
    if (newSortType === sortType) return; // 같은 정렬 타입이면 무시
    
    setIsSorting(true);
    setSortType(newSortType);
    
    // 부드러운 전환을 위한 짧은 지연
    setTimeout(() => {
      setIsSorting(false);
    }, 300);
  };

  // 생성/수정 모달 제출 성공 시 공통 처리
  const handleSubmissionSuccess = (response, mode) => {
    const newPlanId = response?.body?.planId;

    // 모달 닫기 및 상태 초기화
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingPlan(null);

    // 생성 모드이고 newPlanId가 유효하면 해당 페이지로 이동
    if (mode !== 'edit' && newPlanId) {
      navigate(`/plan/${newPlanId}`);
    } else {
      // 수정 모드이거나 planId가 없는 경우 목록 새로고침
      fetchPlans();
    }
  };

  if (isPageLoading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 font-['Poppins']">
        <div className="max-w-7xl mx-auto px-4 pt-[80px] pb-12">
          {/* 헤더 섹션 */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 font-['Poppins']">나의 여행 계획</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-['Poppins']">
              함께 떠날 여행을 계획하고, 완료된 여행들을 추억해보세요
            </p>
          </div>

          {/* 계획중인 여행 */}
          <div className="plan-ing mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-slate-800 rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-800 font-['Poppins']">계획중인 여행</h2>
                <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm font-medium font-['Poppins']">
                  {ongoingPlans.length}개
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-gray-200/30">
                <button 
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 font-['Poppins'] ${
                    sortType === 'created' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/60'
                  }`}
                  onClick={() => handleSortChange('created')}
                >
                  생성순
                </button>
                <div className="w-px h-3 bg-gray-300/40"></div>
                <button 
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 font-['Poppins'] ${
                    sortType === 'date' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/60'
                  }`}
                  onClick={() => handleSortChange('date')}
                >
                  날짜순
                </button>
              </div>
            </div>
            
            <div className={`main-content-ing grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 transition-all duration-500 ease-in-out ${
              isSorting ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}>
              {ongoingPlans.map((plan, index) => (
                <div
                  key={plan.planId}
                  className={`transition-all duration-500 ease-out ${
                    isSorting 
                      ? 'opacity-0 transform -translate-y-4' 
                      : 'opacity-100 transform translate-y-0'
                  }`}
                  style={{
                    transitionDelay: isSorting ? '0ms' : `${index * 50}ms`
                  }}
                >
                  <Card
                    planData={plan}
                    onView={() => handleCardClick(plan)}
                    onEdit={() => handleEditClick(plan)}
                    onDelete={() => handleDeleteClick(plan)}
                    onLeave={handleLeave}
                    isAnyPopoverOpen={isAnyPopoverOpen}
                    onPopoverOpenChange={setIsAnyPopoverOpen}
                  />
                </div>
              ))}
              <div
                className={`transition-all duration-500 ease-out ${
                  isSorting 
                    ? 'opacity-0 transform -translate-y-4' 
                    : 'opacity-100 transform translate-y-0'
                }`}
                style={{
                  transitionDelay: isSorting ? '0ms' : `${ongoingPlans.length * 50}ms`
                }}
              >
                <PlanAddCard onClick={() => setIsCreateModalOpen(true)} />
              </div>
            </div>
          </div>

          {/* 완료된 여행 */}
          <div className="plan-done">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-slate-500 to-slate-700 rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-800 font-['Poppins']">완료된 여행</h2>
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium font-['Poppins']">
                  {completedPlans.length}개
                </span>
              </div>
            </div>
            <div className="main-content-done grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {completedPlans.map((plan) => (
                <Card
                  key={plan.planId}
                  planData={plan}
                  onView={() => handleCardClick(plan)}
                  onEdit={() => handleEditClick(plan)}
                  onDelete={() => handleDeleteClick(plan)}
                  onLeave={handleLeave}
                  isAnyPopoverOpen={isAnyPopoverOpen}
                  onPopoverOpenChange={setIsAnyPopoverOpen}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 생성 모달 */}
      {isCreateModalOpen && (
        <PlanPostModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleSubmissionSuccess}
        />
      )}

      {/* 수정 모달 */}
      {isEditModalOpen && editingPlan && (
        <PlanPostModal
          mode="edit"
          initialData={editingPlan}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleSubmissionSuccess}
        />
      )}
      
      <LoadingOverlay isVisible={isLoading} message="처리 중..." />
    </>
  );
};

export default PlanList;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../organisms/Card";
import PlanAddCard from "../organisms/PlanAddCard";
import PlanPostModal from "../organisms/PlanPostModal";
import LoadingOverlay from "../atoms/LoadingOverlay";
import { getPlanList } from "../../apis/planList";
import { deletePlan } from "../../apis/planDelete";
import { createPlan } from "../../apis/PlanCreate";
import { updatePlan } from "../../apis/planUpdate";

const PlanList = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // "계획중인 여행"과 "완료된 여행"을 위한 상태를 분리할 수 있으나, 우선 "계획중인 여행"만 가져옵니다.
  const [ongoingPlans, setOngoingPlans] = useState([]);
  // const [completedPlans, setCompletedPlans] = useState([]); // 추후 완료된 여행 목록을 위해 사용

  // 팝오버가 하나라도 열려있는지 관리하는 상태
  const [isAnyPopoverOpen, setIsAnyPopoverOpen] = useState(false);

  // 여행 계획 목록 조회
  const fetchPlans = async () => {
    setIsPageLoading(true);
    try {
      // "계획중인" 여행 목록만 가져옵니다.
      const ongoingPlanData = await getPlanList({
        // status: 'ING', // 서버에서 상태 필터링을 지원하는 경우 사용
        sort: 'CREATED_AT,desc', // 최신순으로 정렬
      });
      setOngoingPlans(ongoingPlanData || []);

      // 추후 "완료된" 여행 목록도 동일하게 가져올 수 있습니다.
      // const completedPlanData = await getPlanList({ status: 'DONE', ... });
      // setCompletedPlans(completedPlanData || []);

    } catch (error) {
      console.error('여행 계획 목록 조회 실패:', error);
      setOngoingPlans([]);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // 카드 클릭 핸들러
  const handleCardClick = (planData) => {
    navigate(`/plan/${planData.planId}`);
  };

  // 수정 버튼 클릭 핸들러
  const handleEditClick = (planData) => {
    setEditingPlan(planData);
    setIsEditModalOpen(true);
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

  // 생성/수정 모달 제출 성공 시 공통 처리
  const handleSubmissionSuccess = async () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingPlan(null);
    await fetchPlans(); // 목록 새로고침
  };

  if (isPageLoading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-[50px]">
        {/* 계획중인 여행 */}
        <div className="plan-ing mb-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-extrabold mb-2 mt-8">계획중인 여행</h2>
            <div className="text-base font-normal text-gray-400 mb-2">생성순 | 날짜순</div>
          </div>
          <div className="main-content-ing grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-8">
            {ongoingPlans.map((plan) => (
              <Card
                key={plan.planId}
                planData={plan}
                onView={() => handleCardClick(plan)}
                onEdit={() => handleEditClick(plan)}
                onDelete={() => handleDeleteClick(plan)}
                isAnyPopoverOpen={isAnyPopoverOpen}
                onPopoverOpenChange={setIsAnyPopoverOpen}
              />
            ))}
            <PlanAddCard onClick={() => setIsCreateModalOpen(true)} />
          </div>
        </div>

        {/* 완료된 여행 */}
        <div className="plan-done">
          <h2 className="text-2xl font-extrabold mb-2 mt-8">완료된 여행</h2>
          <div className="main-content-done grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-8">
            {/* 추후 완료된 여행 데이터를 여기에 맵핑합니다. */}
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

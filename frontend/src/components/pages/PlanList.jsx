import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../organisms/Card";
import PlanAddCard from "../organisms/PlanAddCard";
import PlanPostModal from "../organisms/PlanPostModal";
import LoadingOverlay from "../atoms/LoadingOverlay";
import { getPlanList } from "../../apis/planList";
import { deletePlan } from "../../apis/planDelete";
import { updatePlan } from "../../apis/planUpdate";


const PlanList = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // 여행 계획 목록 조회
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getPlanList({ 
        status: 'ING', 
        sort: 'CREATED_AT',
        size: 20
      });
      console.log('여행 계획 목록:', response);
      setPlans(response.data || []);
    } catch (error) {
      console.error('여행 계획 목록 조회 실패:', error);
      // 임시 데이터로 대체
      setPlans([
        {
          id: 1,
          nickname: "김경진",
          name: "일본 - 도쿄",
          description: "일본여행이에염 아렁마ㅣ너랴ㅐㄷㅈ벅래ㅑㅓ라;ㄴ엄리ㅏ운리ㅏㅇ 누ㅑㄷ괘ㅑ두루리팦ㅇㅍㅇㄴㅍ",
          startDate: "2025.07.21",
          endDate: "2025.07.25",
          hashTag: "친구들 #일본",
          imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3XSTeOWGITHWBsn8mK9hDHBfBgSFDllNaPw&s",
          avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
          participants: []
        },
        {
          id: 2,
          nickname: "박철수",
          name: "제주도 여행",
          description: "제주도에서 맛있는 음식 먹고 예쁜 곳 구경하기",
          startDate: "2025.08.01",
          endDate: "2025.08.03",
          hashTag: "가족 #제주도",
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
          avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
          participants: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchPlans();
  }, []);

  // 카드 클릭 시 Plan 페이지로 이동
  const handleCardClick = async (cardData) => {
    setIsLoading(true);
    
    try {
      // 임시로 1초 지연 (실제로는 API 호출 등이 들어갈 자리)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const planId = cardData?.id || 1;
      navigate(`/plan/${planId}`);
    } catch (error) {
      console.error('페이지 이동 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 수정 버튼 클릭 시 호출
  const handleEdit = (cardData) => {
    console.log('PlanList에서 수정 버튼 클릭됨!', cardData);
    setEditingCard(cardData);
    setEditModalOpen(true);
  };

  // 삭제 버튼 클릭 시 호출
  const handleDelete = async (cardData) => {
    console.log('PlanList에서 삭제 버튼 클릭됨!', cardData);
    try {
      await deletePlan(cardData.id);
      console.log('계획 삭제 성공');
      // 목록 다시 로드
      fetchPlans();
    } catch (error) {
      console.error('계획 삭제 실패:', error);
    }
  };

  // 생성 모달 닫기
  const handleCreateModalClose = () => {
    setModalOpen(false);
  };

  // // 생성 제출 처리
  // const handleCreateSubmit = async (formData) => {
  //   console.log('생성된 데이터:', formData);
  //   try {
  //     // 실제 createPlan API 호출
  //     await createPlan(formData);
  //     console.log('계획 생성 성공');
  //     setModalOpen(false);
  //     // 목록 다시 로드
  //     fetchPlans();
  //   } catch (error) {
  //     console.error('계획 생성 실패:', error);
  //     // 백엔드 API가 아직 개발되지 않은 경우를 위한 안내
  //     if (error.response?.status === 500) {
  //       alert('백엔드 API가 아직 개발 중입니다. 잠시 후 다시 시도해주세요.');
  //     } else {
  //       alert('계획 생성에 실패했습니다. 다시 시도해주세요.');
  //     }
  //     // 모달은 닫지 않고 유지 (사용자가 다시 시도할 수 있도록)
  //   }
  // };

  // 수정 모달 닫기
  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditingCard(null);
  };

  // 수정 제출 처리
  const handleEditSubmit = async (formData) => {
    console.log('수정된 데이터:', formData);
    try {
      await updatePlan(editingCard.id, formData);
      console.log('계획 수정 성공');
      setEditModalOpen(false);
      setEditingCard(null);
      // 목록 다시 로드
      fetchPlans();
    } catch (error) {
      console.error('계획 수정 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-[50px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
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
          <div className="
            main-content-ing
            grid
            gap-8
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            py-8
          ">
            {/* 카드들 */}
            {plans.map((plan) => (
              <Card
                key={plan.id}
                nickname={plan.nickname}
                name={plan.name}
                description={plan.description}
                startDate={plan.startDate}
                endDate={plan.endDate}
                hashTag={plan.hashTag}
                imageUrl={plan.imageUrl}
                avatarUrl={plan.avatarUrl}
                participants={plan.participants}
                onView={() => handleCardClick(plan)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onEditSuccess={fetchPlans}
                onDeleteSuccess={fetchPlans}
              />
            ))}
            {/* 계획 추가 버튼 */}
            <PlanAddCard onClick={() => setModalOpen(true)} />
          </div>
        </div>
        {/* 완료된 여행 */}
        <div className="plan-done">
          <h2 className="text-2xl font-extrabold mb-2 mt-8">완료된 여행</h2>
          <div className="
            main-content-done
            grid
            gap-8
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            py-8
          ">
            {/* 완료된 여행은 아직 없음 */}
          </div>
        </div>
        {/* 생성 모달 */}
        {modalOpen && (
          <PlanPostModal 
            onClose={handleCreateModalClose}
          />
        )}
        
        {/* 수정 모달 */}
        {editModalOpen && editingCard && (
          <PlanPostModal
            mode="edit"
            initialData={editingCard}
            onClose={handleEditModalClose}
          />
        )}
      </div>

      {/* 로딩 오버레이 */}
      <LoadingOverlay 
        isVisible={isLoading} 
        message="계획 상세 페이지로 이동 중..." 
      />
    </>
  );
};

export default PlanList;
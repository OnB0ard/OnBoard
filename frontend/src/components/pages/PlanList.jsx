import React, { useState } from "react";
import Card1 from "../organisms/Card1";
import PlanAddCard from "../organisms/PlanAddCard";
import PlanPostModal from "../organisms/PlanPostModal"; // 경로는 실제 위치에 맞게 수정

const PlanList = () => {
  const [modalOpen, setModalOpen] = useState(false);

  // 예시 카드 데이터
  const ingCards = [];
  const doneCards = [];

  return (                                       
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
          gap-6
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          justify-items-center
          py-8
        ">
          {/* 카드들 */}
          <Card1 />
          <Card1 />
          {/* {ingCards} */}
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
          gap-6
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          justify-items-center
          py-8
        ">
          <Card1 />
          {doneCards}
        </div>
      </div>
      {/* 모달 */}
      {modalOpen && <PlanPostModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default PlanList;
import React from 'react';
import { useParams } from 'react-router-dom';

const Plan = () => {
  const { planId } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 pt-[50px]">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-4">여행 계획 상세</h1>
        <p className="text-gray-600">계획 ID: {planId}</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">여행 계획 내용</h2>
        <p className="text-gray-600">여기서 특정 여행 계획의 상세 내용을 표시합니다.</p>
        <p className="text-gray-600 mt-2">계획 ID: {planId}에 해당하는 데이터를 불러와서 표시할 예정입니다.</p>
      </div>
    </div>
  );
};

export default Plan;
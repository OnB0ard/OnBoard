import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SideBar from '../organisms/SideBar';
import WhiteBoard from '../organisms/WhiteBoard';
import Map from '../organisms/Map';
import EditToolBar from '../organisms/EditToolBar';
import PlaceBlock from '../organisms/PlaceBlock';
import DailyPlanCreate from '../organisms/DailyPlanCreate';

const Plan = () => {
  const { planId } = useParams();
  
  // 화이트보드에 있는 PlaceBlock들
  const [placeBlocks, setPlaceBlocks] = useState([
    {
      id: 1,
      name: "뉴욕김치찌개",
      rating: 4,
      address: "역삼동 825-20번지 강남역센트럴푸르지오...",
      imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
      position: { x: 300, y: 200 }
    },
    {
      id: 2,
      name: "뉴욕김치찌개",
      rating: 4,
      address: "역삼동 825-20번지 강남역센트럴푸르지오...",
      imageUrl: "https://i.namu.wiki/i/DK-BcaE6wDCM-N9UJbeQTn0SD9eWgsX9YKWK827rqjbrzDz0-CxW-JFOCiAsUL3CBZ4zE0UDR-p4sLaYPiUjww.webp",
      position: { x: 100, y: 400 }
    }
  ]);

  // 마우스 드래그 상태
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 드래그앤드롭 상태 (검색 결과에서)
  const [isDragOver, setIsDragOver] = useState(false);

  // 일정 추가 모달 상태
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState(new Set());

  // PlaceBlock 삭제
  const handleRemove = (id) => {
    setPlaceBlocks(prev => prev.filter(block => block.id !== id));
  };

  // 마우스 드래그 시작 (화이트보드 내에서 이동)
  const handleMouseDown = (e, block) => {
    // 일정 추가 모달이 열려있으면 마우스 드래그 비활성화
    if (isDailyPlanModalOpen) {
      return;
    }
    
    console.log('마우스 드래그 시작:', block.name);
    setDraggedBlockId(block.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  // 전역 마우스 이벤트 리스너 추가 (끌고 다니기)
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      // 일정 추가 모달이 열려있으면 마우스 드래그 비활성화
      if (draggedBlockId && !isDailyPlanModalOpen) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        setPlaceBlocks(prev => prev.map(block => 
          block.id === draggedBlockId 
            ? { ...block, position: { x: newX, y: newY } }
            : block
        ));
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedBlockId) {
        console.log('마우스 드래그 종료');
        setDraggedBlockId(null);
      }
    };

    if (draggedBlockId && !isDailyPlanModalOpen) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedBlockId, dragOffset, isDailyPlanModalOpen]);

  // 검색 결과에서 드래그앤드롭 처리
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // 일정 추가 모달이 열려있으면 드래그 리브 무시
    if (isDailyPlanModalOpen) {
      return;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    // 일정 추가 모달이 열려있으면 드롭 무시
    if (isDailyPlanModalOpen) {
      return;
    }
    
    try {
      const placeData = JSON.parse(e.dataTransfer.getData('text/plain'));
      console.log('드롭된 장소:', placeData);
      
      // 드롭 위치 계산
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 새로운 PlaceBlock 추가
      const newBlock = {
        ...placeData,
        id: Date.now() + Math.random(), // 고유 ID 생성
        position: { x, y }
      };
      
      setPlaceBlocks(prev => [...prev, newBlock]);
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  // 일정 추가 모달 상태 변경 핸들러
  const handleDailyPlanModalToggle = (isOpen) => {
    setIsDailyPlanModalOpen(isOpen);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ 
        position: 'relative', 
        width: '100vw', 
        height: '100vh',
        backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        transition: 'background-color 0.2s ease',
        cursor: draggedBlockId ? 'grabbing' : 'default'
      }}
    >
      <SideBar onDailyPlanModalToggle={handleDailyPlanModalToggle} />
      <WhiteBoard />
      <EditToolBar />
      <Map />
      
      {/* 화이트보드의 PlaceBlock들 */}
      {placeBlocks.map((block) => (
        <div
          key={block.id}
          style={{
            position: 'absolute',
            left: block.position.x,
            top: block.position.y,
            zIndex: draggedBlockId === block.id ? 2000 : 1000,
            cursor: 'grab'
          }}
        >
          <PlaceBlock
            place={block}
            onRemove={handleRemove}
            onEdit={() => {}}
            onMouseDown={handleMouseDown}
            isDailyPlanModalOpen={isDailyPlanModalOpen}
          />
        </div>
      ))}
    </div>
  );
};

export default Plan;
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import CalendarModal from "@/components/organisms/CalendarModal";
import PlanImage from "@/components/atoms/PlanImage";
import Icon from "@/components/atoms/Icon";

import "./PlanPostModal.css";

function PlanPostModal({ onClose, onSubmit, mode = 'create', initialData = null }) {
  // State 초기화 - API 명세에 맞게 수정
  const [name, setName] = useState(initialData?.name || ""); // title → name
  const [hashTag, setHashTag] = useState(initialData?.hashTag || ""); // hashtags → hashTag
  const [description, setDescription] = useState(initialData?.description || "");
  const [range, setRange] = useState({
    from: initialData?.startDate ? new Date(initialData.startDate) : undefined,
    to: initialData?.endDate ? new Date(initialData.endDate) : undefined
  });
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModified, setImageModified] = useState(false); // 이미지 수정 여부 추적
  const [originalImageUrl, setOriginalImageUrl] = useState(initialData?.imageUrl || null); // 원본 이미지 URL 저장
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fileInputRef = useRef(null);

  const isEditMode = mode === 'edit';
  let modalTitle, subtitle, submitButtonText;

  if (isEditMode) {
    modalTitle = '여행 계획 수정하기';
    subtitle = '여행 정보를 수정하세요.';
    submitButtonText = '수정하기';
  } else {
    modalTitle = '새로운 여행 계획 만들기';
    subtitle = '함께 떠날 여행의 첫 걸음을 시작해보세요.';
    submitButtonText = '만들기';
  }

  // initialData가 변경될 때 state 업데이트
  useEffect(() => {
    if (initialData && isEditMode) {
      setName(initialData.name || "");
      setHashTag(initialData.hashTag || "");
      setDescription(initialData.description || "");
      setRange({
        from: initialData.startDate ? new Date(initialData.startDate) : undefined,
        to: initialData.endDate ? new Date(initialData.endDate) : undefined
      });
      setImagePreview(initialData.imageUrl || null);
      setOriginalImageUrl(initialData.imageUrl || null);
      setImageModified(false);
    }
  }, [initialData, isEditMode]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const formatDate = (date) => {
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  };
  
  const getDateRangeText = () => {
    if (range.from && range.to) {
      return `${formatDate(range.from)} ~ ${formatDate(range.to)}`;
    }
    return "";
  };

  const handleRangeChange = (selected) => {
    setRange(selected);
    setIsCalendarOpen(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // 새 이미지 미리보기 생성
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      const newImageUrl = URL.createObjectURL(file);
      setImagePreview(newImageUrl);
      
      // 수정 모드에서는 항상 true (파일 객체는 비교 불가)
      // 새로 업로드하는 경우는 항상 수정으로 간주
      setImageModified(true);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // 원본 이미지가 있었다면 제거는 수정으로 간주
    setImageModified(originalImageUrl !== null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    // 날짜를 API 명세에 맞게 포맷팅 (YYYY-MM-DD)
    const startDate = range.from ? range.from.toISOString().split('T')[0] : null;
    const endDate = range.to ? range.to.toISOString().split('T')[0] : null;
    
    onSubmit({
      name,
      hashTag,
      description,
      startDate,
      endDate,
      image: selectedImage,
      imageModified,
    });
  };

  const renderImageSection = () => {
    if (imagePreview) {
      return (
        <div className="relative group">
          <PlanImage src={imagePreview} alt="선택된 이미지" />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
            <div className="flex gap-2">
              <button onClick={handleImageClick} className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-2 rounded-full transition-all" title="이미지 변경">
                <Icon type="camera" />
              </button>
              <button onClick={handleImageRemove} className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-2 rounded-full transition-all" title="이미지 제거">
                <Icon type="trash" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full max-w-2xl aspect-[16/9] overflow-hidden rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <button onClick={handleImageClick} className="h-full w-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
          <Icon type="camera" className="text-4xl mb-2" />
          <span className="text-sm font-medium">대표 이미지 업로드</span>
          <span className="text-xs text-gray-400 mt-1">클릭하여 이미지를 선택하세요</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="plan-post-modal__backdrop">
        <div className="plan-post-modal">
          <div className="plan-post-modal__header">
            <div>
              <h2 className="plan-post-modal__title">{modalTitle}</h2>
              <p className="plan-post-modal__subtitle">{subtitle}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icon type="xmark" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="plan-post-modal__label">
              <Icon type="camera" /> 대표이미지
            </label>
            {renderImageSection()}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="space-y-1">
            <label className="plan-post-modal__label"><Icon type="book" /> 제목</label>
            <Input size="full" placeholder="여행 계획의 제목을 입력하세요" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="plan-post-modal__form-group">
            <div className="flex-1 space-y-1">
              <label className="plan-post-modal__label"><Icon type="hashtag" /> 해시 태그</label>
              <Input size="full" placeholder="#가족, #친구, #제주도" value={hashTag} onChange={(e) => setHashTag(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="plan-post-modal__label"><Icon type="calendar" /> 여행 기간</label>
              <div className="relative">
                <Input value={getDateRangeText()} readOnly placeholder="여행 기간을 선택하세요" />
                <button onClick={() => setIsCalendarOpen(true)} className="absolute inset-y-0 right-2 flex items-center">
                  <Icon type="calendar" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="plan-post-modal__label"><Icon type="document" /> 여행 설명</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="여행 계획에 대한 상세한 설명을 작성해주세요." maxLength={100} />
            <p className="plan-post-modal__counter">{description.length}/100</p>
          </div>

          <div className="plan-post-modal__footer">
            <Button background="white" textColor="black" border="gray" shape="pill" onClick={onClose}>취소</Button>
            <Button background="dark" textColor="white" shape="pill" onClick={handleSubmit}>{submitButtonText}</Button>
          </div>
        </div>
      </div>

      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} onChange={handleRangeChange} />
    </>
  );
}

export default PlanPostModal;
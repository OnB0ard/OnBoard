import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/TextArea";
import { Button } from "@/components/atoms/Button";
import CalendarModal from "@/components/organisms/CalendarModal";
import PlanImage from "@/components/atoms/PlanImage";
import Icon from "@/components/atoms/Icon";
import { usePlanFormStore } from "../../store/usePlanFormStore";

import "./PlanPostModal.css";

// 이미지 압축 함수 
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
};

function PlanPostModal({ onClose, onSubmit, mode = 'create', initialData = null }) {
  const {
    name, setName,
    hashTag, setHashTag,
    description, setDescription,
    range, setRange,
    imagePreview,
    isCalendarOpen, openCalendar, closeCalendar,
    isLoading,
    initialize, setImage, removeImage, handleSubmit, reset,
  } = usePlanFormStore();

  const fileInputRef = useRef(null);

  // 입력 길이 제한 상태 (15자)
  const [nameError, setNameError] = useState(false);
  const [nameShake, setNameShake] = useState(false);
  const [hashError, setHashError] = useState(false);
  const [hashShake, setHashShake] = useState(false);

  const isEditMode = mode === 'edit';
  const modalTitle = isEditMode ? '여행 계획 수정하기' : '새로운 여행 계획 만들기';
  const subtitle = isEditMode ? '여행 정보를 수정하세요.' : '함께 떠날 여행의 첫 걸음을 시작해보세요.';
  const submitButtonText = isEditMode ? '수정하기' : '만들기';
  useEffect(() => {
    initialize(mode, initialData);
    return () => {
      reset();
    };
  }, [mode, initialData, initialize, reset]);
  
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').slice(0, -1);
  };
  
  const getDateRangeText = () => {
    if (range.from && range.to) {
      return `${formatDate(range.from)} ~ ${formatDate(range.to)}`;
    }
    return "여행 기간을 선택하세요";
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      // 1MB 이상만 압축 시도 (스토어에서도 1MB 이상 압축하므로 중복 방지 효과)
      const finalFile = file.size > 1024 * 1024
        ? await compressImage(file, 800, 800, 0.8)
        : file;
      // 압축(또는 원본) 후 5MB 초과 시 첨부하지 않음
      if (finalFile.size > 5 * 1024 * 1024) {
        alert('압축 후에도 파일 크기가 5MB를 초과합니다. 더 작은 이미지를 선택해주세요.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      await setImage(finalFile);
    } catch (e) {
      console.error('이미지 압축 실패, 원본 사용:', e);
      // 압축 실패 시에도 원본이 5MB 초과면 제한
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기가 5MB를 초과합니다. 더 작은 이미지를 선택해주세요.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      await setImage(file);
    }
  };
  
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageRemove = () => {
    removeImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerShake = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 600);
  };

  const handleNameChange = (e) => {
    const val = e.target.value || "";
    if (val.length > 15) {
      setNameError(true);
      triggerShake(setNameShake);
      return; // 15자 초과 입력 방지
    }
    setName(val);
    setNameError(false);
  };

  const handleHashChange = (e) => {
    const val = e.target.value || "";
    if (val.length > 15) {
      setHashError(true);
      triggerShake(setHashShake);
      return; // 15자 초과 입력 방지
    }
    setHashTag(val);
    setHashError(false);
  };

  const handleFormSubmit = () => {
    handleSubmit(mode, initialData?.planId, onClose, onSubmit);
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
            <Input 
              size="full" 
              placeholder="여행 계획의 제목을 입력하세요" 
              value={name} 
              onChange={handleNameChange}
              className={`${nameError ? 'plan-input--error' : ''} ${nameShake ? 'shake' : ''}`}
            />
            {nameError && (
              <p className="plan-post-modal__error">공백 포함 15자 이내로 작성해주세요</p>
            )}
          </div>

          <div className="plan-post-modal__form-group">
            <div className="flex-1 space-y-1">
              <label className="plan-post-modal__label"><Icon type="hashtag" /> 해시 태그</label>
              <Input 
                size="full" 
                placeholder="#가족, #친구, #제주도" 
                value={hashTag} 
                onChange={handleHashChange}
                className={`${hashError ? 'plan-input--error' : ''} ${hashShake ? 'shake' : ''}`}
              />
              {hashError && (
                <p className="plan-post-modal__error">해시태그와 공백 포함 15자 이내로 작성해주세요</p>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label className="plan-post-modal__label"><Icon type="calendar" /> 여행 기간</label>
              <div className="relative">
                <Input value={getDateRangeText()} readOnly onClick={openCalendar} placeholder="여행 기간을 선택하세요" />
                <button onClick={openCalendar} className="absolute inset-y-0 right-2 flex items-center">
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
            <Button background="white" textColor="black" border="gray" shape="pill" onClick={onClose} disabled={isLoading}>취소</Button>
            <Button background="dark" textColor="white" shape="pill" onClick={handleFormSubmit} disabled={isLoading}>
              {isLoading ? '처리 중...' : submitButtonText}
            </Button>
          </div>
        </div>
      </div>

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={closeCalendar} 
        onChange={setRange} 
        initialRange={range} 
      />
    </>
  );
}

export default PlanPostModal;
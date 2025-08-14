import { create } from 'zustand';
import { createPlan } from '@/apis/planCreate';
import { updatePlan } from '@/apis/planUpdate';
import { useAuthStore } from '@/store/useAuthStore';

// 이미지 압축 함수
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 원본 비율 유지하면서 크기 조정
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
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // 압축된 이미지를 Blob으로 변환
      canvas.toBlob((blob) => {
        // 원본 파일명 유지하면서 새로운 File 객체 생성
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

const initialState = {
  name: "",
  hashTag: "",
  description: "",
  range: { from: undefined, to: undefined },
  imagePreview: null,
  selectedImage: null,
  imageModified: false,
  originalImageUrl: null,
  isCalendarOpen: false,
  isLoading: false,
};

export const usePlanFormStore = create((set, get) => ({
  ...initialState,

  setName: (name) => set({ name }),
  setHashTag: (hashTag) => set({ hashTag }),
  setDescription: (description) => set({ description }),
  setRange: (range) => set({ range, isCalendarOpen: false }),
  openCalendar: () => set({ isCalendarOpen: true }),
  closeCalendar: () => set({ isCalendarOpen: false }),

  initialize: (mode, initialData) => {
    if (mode === 'edit' && initialData) {
      set({
        name: initialData.name || "",
        hashTag: initialData.hashTag || "",
        description: initialData.description || "",
        range: {
          from: initialData.startDate ? new Date(initialData.startDate) : undefined,
          to: initialData.endDate ? new Date(initialData.endDate) : undefined
        },
        imagePreview: initialData.imageUrl || null,
        originalImageUrl: initialData.imageUrl || null,
        imageModified: false,
        selectedImage: null,
      });
    } else {
      set(initialState);
    }
  },
  setImage: async (file) => {
    const { imagePreview } = get();
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    try {
      // 파일 크기가 1MB 이상이면 압축
      let processedFile = file;
      if (file.size > 1024 * 1024) { // 1MB
        console.log('이미지 압축 시작:', file.name, file.size);
        processedFile = await compressImage(file);
        console.log('이미지 압축 완료:', processedFile.name, processedFile.size);
      }
      
      const newImageUrl = URL.createObjectURL(processedFile);
      set({ 
        selectedImage: processedFile, 
        imagePreview: newImageUrl,
        imageModified: true 
      });
    } catch (error) {
      console.error('이미지 처리 중 오류:', error);
      // 압축 실패 시 원본 파일 사용
      const newImageUrl = URL.createObjectURL(file);
      set({ 
        selectedImage: file, 
        imagePreview: newImageUrl,
        imageModified: true 
      });
    }
  },

  removeImage: () => {
    const { imagePreview, originalImageUrl } = get();
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    set({
      selectedImage: null,
      imagePreview: null,
      imageModified: originalImageUrl !== null, 
    });
  },
  handleSubmit: async (mode, planId, onClose, onSubmitSuccess) => {
    const { name, range, description, hashTag, selectedImage, imageModified } = get();

    if (!name.trim() || !range.from || !range.to || !description.trim()) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    set({ isLoading: true });

    try {
      const toYYYYMMDD = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startDate = toYYYYMMDD(range.from);
      const endDate = toYYYYMMDD(range.to);
      
      // 현재 사용자 ID 가져오기
      const userId = useAuthStore.getState().userId;
      
      const planData = {
        name: name.trim(),
        hashTag: hashTag.trim(),
        description: description.trim(),
        startDate,
        endDate,
        creatorId: userId, // 생성자 ID 추가
      };

      let response;
      if (mode === 'edit') {
        const updatePayload = {
          ...planData,
          imageModified
        };
        if (imageModified && selectedImage) {
          updatePayload.image = selectedImage;
        }
        response = await updatePlan(planId, updatePayload);
      } else {
        // 이미지가 선택된 경우에만 이미지 데이터 추가
        if (selectedImage && selectedImage instanceof File) {
          // 이미지 크기가 2MB 이상이면 추가 압축
          let finalImage = selectedImage;
          if (selectedImage.size > 2 * 1024 * 1024) { // 2MB
            console.log('최종 압축 시작:', selectedImage.name, selectedImage.size);
            finalImage = await compressImage(selectedImage, 600, 600, 0.7);
            console.log('최종 압축 완료:', finalImage.name, finalImage.size);
          }
          
          planData.image = finalImage;
          console.log('스토어에서 이미지 전달:', finalImage.name, finalImage.size);
        } else {
          console.log('스토어에서 이미지 없음:', selectedImage);
        }
        response = await createPlan(planData);
      }
      
      onSubmitSuccess(response, mode); 
      onClose(); 
      get().reset(); 

    } catch (error) {
      console.error(`플랜 ${mode} 실패:`, error);
      
      // 구체적인 에러 메시지 표시
      let errorMessage = `플랜 ${mode}에 실패했습니다.`;
      
      if (error.response?.status === 413) {
        errorMessage = '이미지 파일이 너무 큽니다. 더 작은 이미지를 선택해주세요.';
      } else if (error.message?.includes('이미지 파일이 너무 큽니다')) {
        errorMessage = error.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      alert(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set(initialState),
}));
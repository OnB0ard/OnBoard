import { create } from 'zustand';
import { createPlan } from '@/apis/planCreate';
import { updatePlan } from '@/apis/planUpdate'; 

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
  setImage: (file) => {
    const { imagePreview } = get();
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    const newImageUrl = URL.createObjectURL(file);
    set({ 
      selectedImage: file, 
      imagePreview: newImageUrl,
      imageModified: true 
    });
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
      const startDate = range.from.toISOString().split('T')[0];
      const endDate = range.to.toISOString().split('T')[0];
      
      const planData = {
        name: name.trim(),
        hashTag: hashTag.trim(),
        description: description.trim(),
        startDate,
        endDate,
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
        planData.imageModified = imageModified;
        planData.image = selectedImage;
        response = await createPlan(planData);
      }
      
      onSubmitSuccess(response); 
      onClose(); 
      get().reset(); 

    } catch (error) {
      console.error(`플랜 ${mode} 실패:`, error);
      alert(`플랜 ${mode}에 실패했습니다. 다시 시도해주세요.`);
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set(initialState),
}));
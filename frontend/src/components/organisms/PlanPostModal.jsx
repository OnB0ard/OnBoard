import { useState, useRef } from "react"
import { Input } from "@/components/atoms/Input"
import { Textarea } from "@/components/atoms/Textarea"
import { Button } from "@/components/atoms/Button"
import CalendarModal from "@/components/organisms/CalendarModal"
import PlanImage from "@/components/atoms/PlanImage"
import Icon from "@/components/atoms/Icon"

import "./PlanPostModal.css"

function PlanPostModal({ onClose, onSubmit }) {
  const [range, setRange] = useState({ from: undefined, to: undefined })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  const formatDate = (date) => {
    if (!date) return ""
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    return `${yyyy}.${mm}.${dd}`
  }

  const handleRangeChange = (selected) => {
    setRange(selected)
    setIsCalendarOpen(false) // CalendarModal에서 완료 버튼을 누르면 닫힘
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      
      // 이미지 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageRemove = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const dateText =
    range.from && range.to
      ? `${formatDate(range.from)} ~ ${formatDate(range.to)}`
      : ""

  return (
    <>
      <div className="plan-post-modal__backdrop">
        <div className="plan-post-modal">
          {/* 헤더 */}
          <div className="plan-post-modal__header">
            <div>
              <h2 className="plan-post-modal__title">새로운 여행 계획 만들기</h2>
              <p className="plan-post-modal__subtitle">
                함께 떠날 여행의 첫 걸음을 시작해보세요
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icon type="xmark" />
            </button>
          </div>

          {/* 대표 이미지 */}
          <div className="space-y-1">
            <label className="plan-post-modal__label"><Icon type="camera" /> 대표이미지</label>
            <PlanImage
              src={imagePreview}
              alt="선택된 이미지"
              showUploadUI={true}
              onImageClick={handleImageClick}
              onImageRemove={handleImageRemove}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <label className="plan-post-modal__label"><Icon type="book" /> 제목</label>
            <Input size="full" placeholder="여행 계획의 제목을 입력하세요" />
          </div>

          {/* 해시태그 + 여행기간 */}
          <div className="plan-post-modal__form-group">
            <div className="flex-1 space-y-1">
              <label className="plan-post-modal__label"><Icon type="hashtag" /> 해시 태그</label>
              <Input size="full" placeholder="#가족, #친구, #제주도" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="plan-post-modal__label"><Icon type="calendar" /> 여행 기간</label>
              <div className="relative">
                <Input
                  value={dateText}
                  readOnly // 직접 입력하는걸 하려고 헀지만 처리하는데 번거로움이 많음.
                  placeholder="여행 기간을 선택하세요"
                />
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="absolute inset-y-0 right-2 flex items-center"
                >
                  <Icon type="calendar" />
                </button>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="plan-post-modal__label"><Icon type="document" /> 여행 설명</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="여행 계획에 대한 상세한 설명을 작성해주세요."
              maxLength={100}
            />
            <p className="plan-post-modal__counter">{description.length}/100</p>
          </div>

          {/* 버튼 */}
          <div className="plan-post-modal__footer">
            <Button
              background="white"
              textColor="black"
              border="gray"
              shape="pill"
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              background="dark"
              textColor="white"
              shape="pill"
              onClick={() => onSubmit({ 
                image: selectedImage,
                dateRange: range,
                description: description 
              })}
            >
              만들기
            </Button>
          </div>
        </div>
      </div>

      {/* 달력 모달 */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onChange={handleRangeChange}
      />
    </>
  )
}

export default PlanPostModal

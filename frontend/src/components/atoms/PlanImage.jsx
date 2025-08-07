import React from "react"

// 여행계획 이미지 파일 첨부시 비율 가로:세로=16:9 되게
const PlanImage = ({ src, alt = "계획 이미지" }) => {
  const defaultImage = "/images/planImage_default3.png"
  
  return (
    <div className="w-full max-w-2xl aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
      <img
        src={src || defaultImage} // src 지정하지 않으면 기본 이미지로.
        alt={alt}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

export default PlanImage

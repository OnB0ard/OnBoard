import React from "react"

// 여행계획 이미지 파일 첨부시 비율 가로:세로=16:9 되게
const PlanImage = ({ alt = "계획 이미지" }) => {
  return (
    <div className="w-full max-w-2xl aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
      <img
        src="https://t1.daumcdn.net/brunch/service/user/cnoC/image/tNWE6ahM8L07uaj81q4HjFD6qrY"
        alt={alt}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

export default PlanImage
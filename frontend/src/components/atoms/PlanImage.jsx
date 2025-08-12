// PlanImage.jsx
const PlanImage = ({ src, alt }) => {
  const defaultImage = '/images/planImage_default.png'; // 없는 경우 기본 이미지

  return (
    <div className="w-full aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
      <img
        src={src || defaultImage}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = defaultImage;
        }}
      />
    </div>
  );
};

export default PlanImage;

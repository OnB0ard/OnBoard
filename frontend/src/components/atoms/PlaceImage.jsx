// 장소 사진(썸네일)
import Icon from './Icon';

const PlaceImage = ({ imageUrl, isBookmarked = false, onBookmarkClick }) => {
    const defaultImage = 'https://placehold.co/40x40/E5E7EB/6B7280?text=이미지';
  
  return (
    <div className="relative group">
      <img 
        src={imageUrl || defaultImage} 
        alt="장소 이미지"
        className="w-10 h-10 object-cover rounded-md"
        onError={(e) => {
          e.target.src = defaultImage;
        }}
      />
      <button 
        onClick={onBookmarkClick}
        className={`absolute top-1 right-1 p-1.5 rounded-full transition-all duration-200 ${
          isBookmarked 
            ? 'bg-yellow-400 shadow-md hover:bg-yellow-500' 
            : 'bg-white/80 shadow-sm hover:bg-white hover:shadow-md opacity-0 group-hover:opacity-100'
        }`}
      >
        <Icon 
          type={isBookmarked ? "bookmark-filled" : "bookmark-empty"} 
          className={`w-3 h-3 ${isBookmarked ? 'text-white' : 'text-gray-600'}`} 
        />
      </button>
    </div>
  );
};

export default PlaceImage;
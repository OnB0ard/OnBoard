// 장소 사진(썸네일)
import Icon from './Icon';

const PlaceImage = ({ imageUrl, isBookmarked = false, onBookmarkClick }) => {
  return (
    <div className="relative group">
      <img 
        src={imageUrl || 'https://via.placeholder.com/60x60/E5E7EB/6B7280?text=이미지'} 
        alt="장소 이미지"
        className="w-15 h-15 object-cover rounded-md"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/60x60/E5E7EB/6B7280?text=이미지';
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
import React from 'react';
import Icon from '../atoms/Icon';
import { Input } from '../atoms/Input';

const SearchBar = React.forwardRef(({ 
  type = "listsearch", 
  onSearch, 
  value, 
  onChange, 
  onKeyDown, 
  placeholder 
}, ref) => {

  const handleIconClick = () => {
    onSearch?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
    }
    onKeyDown?.(e);
  };

  const baseInputClass = "pl-0 text-sm bg-transparent border-none outline-none focus:ring-0";

  const typeStyles = {
    mapsearch: {
      container: "flex items-center justify-between w-full px-4 py-2 bg-[#E1EAFD] rounded-3xl",
      placeholder: "장소를 검색해보세요."
    },
    listsearch: {
      container: "flex items-center justify-between w-full px-6 py-2 bg-gradient-to-r from-gray-50 via-slate-50 to-zinc-50 rounded-full border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm overflow-hidden",
      placeholder: "해시태그나 제목을 검색하여 여행 계획을 찾아보세요!"
    }
  };

  const currentStyle = typeStyles[type] || typeStyles.listsearch;

  return (
    <div className="planlist-searchbar">
      <div className="search-container">
        <div className={currentStyle.container}>
          <Input
            ref={ref}
            size="full"
            placeholder={placeholder || currentStyle.placeholder}
            className={baseInputClass}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
          />
          <Icon 
            type="search" 
            onClick={handleIconClick} 
            className="search-icon cursor-pointer hover:opacity-80 transition-all duration-300 text-gray-600"
          />
        </div>
      </div>
    </div>
  );
});

export default SearchBar;

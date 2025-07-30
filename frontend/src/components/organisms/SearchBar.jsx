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
      container: "flex items-center justify-between w-2/5 max-w-[500px] px-4 py-2 bg-[#E1EAFD] rounded-3xl",
      placeholder: "Which List?"
    }
  };

  const currentStyle = typeStyles[type] || typeStyles.listsearch;

  return (
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
        className="cursor-pointer hover:opacity-70 transition-opacity"
      />
    </div>
  );
});

export default SearchBar;

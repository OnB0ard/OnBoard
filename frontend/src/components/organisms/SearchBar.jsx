import { useState } from 'react';
import Icon from '../atoms/Icon';
import { Input } from '../atoms/Input';

const SearchBar = ({ type = "listsearch", onSearch }) => {
  const [value, setValue] = useState("");

  const handleSearch = () => {
    if(!value.trim())return; // 공백, 빈 문자열의 경우 
    onSearch?.(value);
  };

  switch (type) {
    case "mapsearch":
      return (
        <div className="flex items-center justify-between w-1/5 max-w-[300px] px-4 py-2 bg-[#E1EAFD] rounded-3xl">
          <Input
            size="full"
            placeholder="Which Location?"
            className="pl-0 text-sm bg-transparent border-none outline-none focus:ring-0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Icon type="search" onClick={handleSearch} />
        </div>
      );
    case "listsearch":
      return (
        <div className="flex items-center justify-between w-2/5 max-w-[500px] px-4 py-2 bg-[#E1EAFD] rounded-3xl">
          <Input
            size="full"
            placeholder="Which List?"
            className="pl-0 text-sm bg-transparent border-none outline-none focus:ring-0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Icon type="search" onClick={handleSearch} />
        </div>
      );
    default:
      return null;
  }
};

export default SearchBar;

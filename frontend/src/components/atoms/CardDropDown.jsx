import React, { useState, useRef, useEffect } from 'react';
import './CardDropDown.css';

const CardDropDown = ({ children, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom-right');
  const dropdownRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 드롭다운이 열렸을 때 부모 요소의 호버 효과 방지
  useEffect(() => {
    if (isOpen) {
      // 부모 블록에 클래스 추가
      const parentBlock = dropdownRef.current?.closest('.daily-place-block');
      if (parentBlock) {
        parentBlock.classList.add('dropdown-open');
      }
    } else {
      // 부모 블록에서 클래스 제거
      const parentBlock = dropdownRef.current?.closest('.daily-place-block');
      if (parentBlock) {
        parentBlock.classList.remove('dropdown-open');
      }
    }
  }, [isOpen]);

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    
    if (!isOpen) {
      // 드롭다운을 열 때 위치 계산
      const rect = dropdownRef.current?.getBoundingClientRect();
      if (rect) {
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        if (spaceBelow < 100 && spaceAbove > 100) {
          setDropdownPosition('top-right');
        } else {
          setDropdownPosition('bottom-right');
        }
      }
    }
    
    setIsOpen(!isOpen);
  };

  return (
    <div className="card-dropdown" ref={dropdownRef}>
      <button
        className="card-dropdown-trigger"
        onClick={handleToggle}
      >
        {children}
      </button>
      
      {isOpen && (
        <div className={`card-dropdown-menu ${dropdownPosition}`}>
          {items.map((item, index) => (
            <button
              key={index}
              className={`card-dropdown-item ${item.className || ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
            >
              {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardDropDown;

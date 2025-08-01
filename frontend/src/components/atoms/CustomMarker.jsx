import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Bed, Utensils, Coffee, Store, Camera, MapPin } from 'lucide-react';
import './CustomMarker.css';

const colorPalette = {
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
  blue: '#4285F4',
  purple: '#9C27B0',
  pink: '#E91E63',
  orange: '#FF5722',
  cyan: '#00BCD4',
  'blue-grey': '#607D8B',
  brown: '#795548',
  default: '#4285F4',
};

const iconComponents = {
  숙소: <Bed size={14} color="white" />,
  식당: <Utensils size={14} color="white" />,
  카페: <Coffee size={14} color="white" />,
  상점: <Store size={14} color="white" />,
  명소: <Camera size={14} color="white" />,
  기타: '',
};

const CustomMarker = ({
  position,
  onClick,
  children,
  color = 'default',
  type = 'default',
}) => {
  const pinColor = colorPalette[color] || colorPalette.default;
  const Icon = iconComponents[type] || iconComponents.default;

  return (
    <AdvancedMarker position={position} onClick={onClick}>
      <div className="custom-marker">
        <div className="pin" style={{ backgroundColor: pinColor }}>
          {Icon}
        </div>
        <div className="pin-dot"></div>
        {children && <div className="marker-content">{children}</div>}
      </div>
    </AdvancedMarker>
  );
};

export default CustomMarker;

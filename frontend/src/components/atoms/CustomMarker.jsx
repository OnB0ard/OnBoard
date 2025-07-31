import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
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



const CustomMarker = ({ position, onClick, children, color = 'default' }) => {
  const pinColor = colorPalette[color] || colorPalette.default;

  return (
    <AdvancedMarker position={position} onClick={onClick}>
      <div className="custom-marker">
        <div className="pin" style={{ backgroundColor: pinColor }}></div>
        <div className="pin-dot"></div>
        {children && <div className="marker-content">{children}</div>}
      </div>
    </AdvancedMarker>
  );
};

export default CustomMarker;

import React from 'react';
import useMapStore from '../../store/useMapStore';

export default function SearchResultsModal() {
  const { isModalOpen, places, handleMarkerClick, setIsModalOpen } = useMapStore();

  if (!isModalOpen) return null;
  console.log(places);
  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h3>검색 결과</h3>
          <button onClick={() => setIsModalOpen(false)} style={closeButtonStyle}>✕</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '60vh', overflowY: 'auto' }}>
          {places.map(place => (
            <li key={place.id} onClick={() => handleMarkerClick(place)} style={listItemStyle}>
              <strong>{place.displayName}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};
const modalContentStyle = {
  background: 'white', padding: '20px', borderRadius: '8px',
  width: '400px',
};
const modalHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px'
};
const listItemStyle = {
  padding: '15px', cursor: 'pointer', borderBottom: '1px solid #eee'
};
const closeButtonStyle = {
  border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer'
};
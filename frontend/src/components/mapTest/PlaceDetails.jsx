import React from 'react';

export default function PlaceDetails({ place, query }) {
  if (!place) return null;

  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  // ✅ 1. 장소 유형을 판별하는 로직 추가
  let placeType = '장소'; // 기본값
  if (place.types?.includes('restaurant')) {
    placeType = '음식점';
  } else if (place.types?.includes('cafe')) {
    placeType = '카페';
  } else if (place.types?.includes('tourist_attraction')) {
    placeType = '명소';
  } else if (place.types?.includes('store')) {
    placeType = '상점';
  }

  return (
    <div style={{ padding: '10px', fontFamily: 'sans-serif', maxWidth: '300px' }}>
      <div style={headerStyle}>
        <div style={titleStyle}>{place.displayName}</div>
        {/* ✅ 2. 판별된 유형을 태그로 표시 */}
        <div style={typeStyle}>{placeType}</div>
      </div>

      {place.formattedAddress && (
        <div style={{ marginBottom: '10px', color: '#555' }}>
          {place.formattedAddress}
        </div>
      )}

      {place.rating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span>⭐</span>
          <span>{place.rating} ({place.userRatingCount} ratings)</span>
        </div>
      )}
      
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {place.websiteURI && (
          <a href={place.websiteURI} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            웹사이트 방문하기
          </a>
        )}
        <a href={searchUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Google 지도에서 '{query}' 검색 결과 보기 ↗
        </a>
      </div>

      {place.photos?.[0] && (
        <img
          src={place.photos[0].getURI()}
          alt={place.displayName}
          style={{ width: '100%', height: 'auto', borderRadius: '8px', marginTop: '10px' }}
        />
      )}
    </div>
  );
}

const linkStyle = {
  color: '#1a73e8',
  textDecoration: 'none',
  fontSize: '14px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: '10px'
};

const titleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginRight: '8px'
};

const typeStyle = {
  fontSize: '12px',
  color: 'white',
  background: '#555',
  padding: '2px 6px',
  borderRadius: '4px',
  flexShrink: 0
};
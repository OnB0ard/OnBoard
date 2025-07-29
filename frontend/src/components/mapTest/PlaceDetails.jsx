import React, { useState } from 'react';

export default function PlaceDetails({ place, query }) {
  if (!place) return null;

  const [isOpeningHoursVisible, setIsOpeningHoursVisible] = useState(false);

  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  let placeType = '장소';
  if (place.types?.includes('restaurant')) {
    placeType = '음식점';
  } else if (place.types?.includes('cafe')) {
    placeType = '카페';
  } else if (place.types?.includes('tourist_attraction')) {
    placeType = '명소';
  } else if (place.types?.includes('store')) {
    placeType = '상점';
  }

  // ✅ 3. 오늘 요일을 계산하는 로직 (월요일=0, 화요일=1, ..., 일요일=6)
  // getDay()는 일요일=0을 반환하므로, 구글 API 순서에 맞게 조정합니다.
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <div style={{ padding: '10px', fontFamily: 'sans-serif', maxWidth: '300px' }}>
      <div style={headerStyle}>
        <div style={titleStyle}>{place.displayName}</div>
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

      {/* ✅ 4. 영업시간 토글 UI */}
      {place.regularOpeningHours?.weekdayDescriptions && (
        <div style={{ marginTop: '10px' }}>
          <div 
            onClick={() => setIsOpeningHoursVisible(!isOpeningHoursVisible)} 
            style={toggleHeaderStyle}
          >
            <strong style={{ fontSize: '14px' }}>영업시간</strong>
            <span>{isOpeningHoursVisible ? '▲' : '▼'}</span>
          </div>
          {isOpeningHoursVisible && (
            <ul style={{ listStyle: 'none', padding: '5px 0 0 0', margin: 0, fontSize: '13px', color: '#555' }}>
              {place.regularOpeningHours.weekdayDescriptions.map((text, index) => (
                <li key={index} style={index === todayIndex ? todayStyle : {}}>
                  {text}
                </li>
              ))}
            </ul>
          )}
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

// --- 스타일 ---
const linkStyle = { color: '#1a73e8', textDecoration: 'none', fontSize: '14px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' };
const titleStyle = { fontSize: '18px', fontWeight: 'bold', marginRight: '8px' };
const typeStyle = { fontSize: '12px', color: 'white', background: '#555', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 };
const toggleHeaderStyle = { cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const todayStyle = { fontWeight: 'bold', color: '#000' };
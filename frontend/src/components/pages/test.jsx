// src/components/pages/test.jsx
import React from "react";
import { APIProvider } from '@vis.gl/react-google-maps';
import Map from "../organisms/Map";
import StandaloneAutocomplete from "../mapTest/StandaloneAutocomplete";
import useMapStore from "../../store/useMapStore";

const apiKey = 'AIzaSyBALfPLn3-5jL1DwbRz6FJRIRAp-X_ko-k'; // 본인의 API 키를 입력하세요

function Test() {
  const { isMapVisible, setIsMapVisible } = useMapStore();

  return (
    // ✅ APIProvider를 페이지 레벨에서 감싸 모든 자식들이 라이브러리를 사용하게 합니다.
    <APIProvider apiKey={apiKey}>
      <div style={containerStyle}>
        <h1>Zustand 지도 테스트</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <StandaloneAutocomplete />
        </div>
        
        {!isMapVisible && (
          <button onClick={() => setIsMapVisible(true)} style={showButtonStyle}>
            지도 켜기
          </button>
        )}

        {isMapVisible && <Map />}
      </div>
    </APIProvider>
  );
}

const containerStyle = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const showButtonStyle = {
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
};

export default Test;
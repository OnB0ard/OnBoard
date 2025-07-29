// src/components/molecules/StandaloneAutocomplete.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import useMapStore from '../../store/useMapStore';

export default function StandaloneAutocomplete() {
  const { setTextQuery } = useMapStore();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;
    
    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "name", "geometry"],
      componentRestrictions: { country: 'kr' }
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const newQuery = place.formatted_address || place.name;
        setInputValue(newQuery);
        setTextQuery(newQuery);
      }
    });
  }, [placesLib, setTextQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTextQuery(inputValue);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="장소나 주소를 검색하세요"
        style={{ padding: '10px', fontSize: '16px', width: '300px' }}
      />
      <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>검색</button>
    </form>
  );
}
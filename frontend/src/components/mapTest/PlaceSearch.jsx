import React, { useState, useEffect } from 'react';
import { useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';

const center = { lat: 37.4161493, lng: -122.0812166 };

export default function PlaceSearch() {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (!map || !placesLib) return;

    const placeService = new placesLib.PlacesService(map);
    const request = {
      textQuery: 'Tacos in Mountain View',
      fields: ['displayName', 'location', 'businessStatus'],
      locationBias: center,
      maxResultCount: 8,
    };

    placeService.searchByText(request, (results, status) => {
      if (status === 'OK' && results) {
        setPlaces(results);
      }
    });
  }, [map, placesLib]);

  return (
    <>
      {places.map((place) => (
        <AdvancedMarker
          key={place.id}
          position={place.location}
          title={place.displayName}
        />
      ))}
    </>
  );
}
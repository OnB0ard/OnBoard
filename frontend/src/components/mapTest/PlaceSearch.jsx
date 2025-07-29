import React from 'react';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import PlaceDetails from './PlaceDetails';
import useMapStore from '../../store/useMapStore';

export default function PlaceSearch() {
  const { places, selectedPlace, handleMarkerClick, setSelectedPlace, textQuery } = useMapStore();

  return (
    <>
      {places.map(place => (
        <AdvancedMarker
          key={place.id}
          position={place.location}
          onClick={() => handleMarkerClick(place)}
        />
      ))}
      {selectedPlace && (
        <InfoWindow
          position={selectedPlace.location}
          onCloseClick={() => setSelectedPlace(null)}
          minWidth={200}
        >
          <PlaceDetails place={selectedPlace} query={textQuery} />
        </InfoWindow>
      )}
    </>
  );
}
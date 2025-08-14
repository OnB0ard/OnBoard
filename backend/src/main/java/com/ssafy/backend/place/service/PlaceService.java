package com.ssafy.backend.place.service;

import com.ssafy.backend.place.dto.RetrievePlaceDetailResponseDTO;
import com.ssafy.backend.place.entity.Place;
import com.ssafy.backend.place.exception.PlaceNotExistException;
import com.ssafy.backend.place.repository.PlaceRepository;
import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;

    public RetrievePlaceDetailResponseDTO retrievePlaceDetail(Long placeId) {
        Place place = validatePlaceExistence(placeId);
        return RetrievePlaceDetailResponseDTO.builder()
                .placeId(place.getPlaceId())
                .googlePlaceId(place.getGooglePlaceId())
                .placeName(place.getPlaceName())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .phoneNumber(place.getPhoneNumber())
                .address(place.getAddress())
                .rating(place.getRating())
                .ratingCount(place.getRatingCount())
                .placeUrl(place.getPlaceUrl())
                .imageUrl(place.getImageUrl())
                .siteUrl(place.getSiteUrl())
                .category(place.getCategory())
                .build();
    }

    private Place validatePlaceExistence(Long placeId) {
        return placeRepository.findById(placeId)
                .orElseThrow(() -> new PlaceNotExistException("존재하지 않는 장소입니다. placeId=" + placeId));
    }
}

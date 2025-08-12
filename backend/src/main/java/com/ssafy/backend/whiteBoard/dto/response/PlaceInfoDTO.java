package com.ssafy.backend.whiteBoard.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PlaceInfoDTO {
    private Long placeId;
    private String googlePlaceId;
    private String placeName;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double rating;
    private String imageUrl;
}
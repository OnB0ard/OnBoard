package com.ssafy.backend.place.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RetrievePlaceDetailResponseDTO {
    private Long placeId;
    private String googlePlaceId;
    private String placeName;
    private Double latitude;
    private Double longitude;
    private String phoneNumber;
    private String address;
    private Double rating;
    private Integer ratingCount;
    private String placeUrl;
    private String imageUrl;
    private String siteUrl;
    private String category;
}

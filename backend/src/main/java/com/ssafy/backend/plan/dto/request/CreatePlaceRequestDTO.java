package com.ssafy.backend.plan.dto.request;

import lombok.Getter;

@Getter
public class CreatePlaceRequestDTO {
    private String googlePlaceId;
    private String placeName;
    private Double latitude;
    private Double longitude;
    private String phoneNumber;
    private String address;
    private Double rating;
    private Integer ratingCount;
    private String googleUrl;
    private String googleImg;
}

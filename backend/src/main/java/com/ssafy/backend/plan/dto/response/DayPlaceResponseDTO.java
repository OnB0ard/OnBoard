package com.ssafy.backend.plan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DayPlaceResponseDTO {
    private Long dayPlaceId;
    private Integer indexOrder;
    private String memo;

    private Long placeId;
    private String googlePlaceId;
    private String placeName;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double rating;
    private Integer ratingCount;
    private String imageUrl;
    private String category;
}

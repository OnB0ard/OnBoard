package com.ssafy.backend.plan.dto.websocket;

import com.ssafy.backend.plan.dto.request.CreatePlaceRequestDTO;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookmarkSocketDTO {
    private String action;
    private Long bookmarkId;

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

    public CreatePlaceRequestDTO toCreatePlaceRequestDTO() {
        return CreatePlaceRequestDTO.builder()
                .googlePlaceId(googlePlaceId)
                .placeName(placeName)
                .latitude(latitude)
                .longitude(longitude)
                .phoneNumber(phoneNumber)
                .address(address)
                .rating(rating)
                .ratingCount(ratingCount)
                .placeUrl(placeUrl)
                .imageUrl(imageUrl)
                .siteUrl(siteUrl)
                .category(category)
                .build();
    }
}

package com.ssafy.backend.whiteBoard.dto.request;

import lombok.Builder;
import lombok.Getter;
@Getter
@Builder
public class CreateTravelRequestDTO {
    private ObjectInfo objectInfo;
    private WhiteBoardPlaceInfo whiteBoardPlace;

    @Getter
    @Builder
    public static class ObjectInfo {
        private double x;
        private double y;
    }

    @Getter
    @Builder
    public static class WhiteBoardPlaceInfo {
        private String googlePlaceId;
        private String placeName;
        private double latitude;
        private double longitude;
        private String phoneNumber;
        private String address;
        private double rating;
        private int ratingCount;
        private String placeUrl;
        private String imageUrl;
        private String siteUrl;
        private String category;
    }
}

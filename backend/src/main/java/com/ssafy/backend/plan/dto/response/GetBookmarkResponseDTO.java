package com.ssafy.backend.plan.dto.response;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GetBookmarkResponseDTO {
    private Long bookmarkId;
    private Long placeId;
    private String placeName;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double rating;
    private Integer ratingCount;
    private String imageUrl;
}

package com.ssafy.backend.plan.dto.response;

import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookmarkResponseDTO {
    private Long placeId;
    private String placeName;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double rating;
    private String imageUrl;
}

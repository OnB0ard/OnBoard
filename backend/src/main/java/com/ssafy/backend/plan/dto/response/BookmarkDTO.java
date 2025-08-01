package com.ssafy.backend.plan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookmarkDTO {
    private Long placeId;
    private String placeName;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double rating;
    private String imageUrl;
}

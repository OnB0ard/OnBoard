package com.ssafy.backend.plan.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateBookmarkResponseDTO {
    private Long bookmarkId;
    private Long placeId;
}

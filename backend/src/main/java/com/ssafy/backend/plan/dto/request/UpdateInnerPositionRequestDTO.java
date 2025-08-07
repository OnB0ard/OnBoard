package com.ssafy.backend.plan.dto.request;

import lombok.Getter;

@Getter
public class UpdateInnerPositionRequestDTO {
    private Long dayPlaceId;
    private Integer indexOrder;
    private Integer modifiedIndexOrder;
}

package com.ssafy.backend.plan.dto.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UpdateOuterPositionRequestDTO {
    private Long dayPlaceId;
    private Long modifiedDayScheduleId;
    private Integer indexOrder;
    private Integer modifiedIndexOrder;
}

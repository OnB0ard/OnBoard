package com.ssafy.backend.plan.dto.request;

import lombok.Getter;

@Getter
public class UpdateOuterPositionRequestDTO {
    private Long dayPlaceId;
    private Long modifiedDayScheduleId;
    private Integer dayOrder;
    private Integer indexOrder;
    private Integer modifiedDayOrder;
    private Integer modifiedIndexOrder;
}

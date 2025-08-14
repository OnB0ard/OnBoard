package com.ssafy.backend.plan.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateDayScheduleResponseDTO {
    private Long dayScheduleId;
    private Long planId;
    private Integer dayOrder;
    private String title;
}

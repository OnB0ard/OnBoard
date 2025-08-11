package com.ssafy.backend.plan.dto.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateDayScheduleRequestDTO {
    private String title;
    private Integer dayOrder;
}

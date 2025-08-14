package com.ssafy.backend.plan.dto.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RenameDayScheduleRequestDTO {
    private String title;
}

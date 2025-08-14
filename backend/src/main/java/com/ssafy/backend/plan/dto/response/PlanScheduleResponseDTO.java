package com.ssafy.backend.plan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlanScheduleResponseDTO {
    List<DayScheduleResponseDTO> planSchedule;
}

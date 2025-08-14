package com.ssafy.backend.plan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.sql.In;

import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DayScheduleResponseDTO {
    private Long dayScheduleId;
    private Integer dayOrder;
    private String title;
    private List<DayPlaceResponseDTO> daySchedule;
}

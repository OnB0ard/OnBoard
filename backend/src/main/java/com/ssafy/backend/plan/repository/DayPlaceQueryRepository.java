package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DayPlace;
import com.ssafy.backend.plan.entity.DaySchedule;

import java.util.List;

public interface DayPlaceQueryRepository {
    List<DayPlace> getPlanScheduleByPlanId(Long planId);
    List<DayPlace> getDayScheduleByDayScheduleIdAndPlanId(Long dayScheduleId, Long planId);
}

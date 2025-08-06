package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DayPlace;
import com.ssafy.backend.plan.entity.DaySchedule;

import java.util.List;
import java.util.Optional;

public interface DayPlaceQueryRepository {
    List<DayPlace> getPlanScheduleByPlanId(Long planId);
    List<DayPlace> getDayScheduleByDayScheduleIdAndPlanId(Long dayScheduleId, Long planId);
    DayPlace findByPlanIdAndDayScheduleIdAndDayPlaceId(Long planId, Long dayScheduleId, Long dayPlaceId);
}

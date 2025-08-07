package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DaySchedule;

public interface DayScheduleQueryRepository {
    public DaySchedule findByPlanIdAndDayScheduleId(Long planId, Long dayScheduleId);
}

package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DaySchedule;

import java.util.List;

public interface DayScheduleQueryRepository {
    public DaySchedule findByPlanIdAndDayScheduleId(Long planId, Long dayScheduleId);
    public List<DaySchedule> findByPlanId(Long planId);
}

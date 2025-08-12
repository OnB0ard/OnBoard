package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DaySchedule;

import java.util.List;

public interface DayScheduleQueryRepository {
    // planId와 dayScheduleId 두 개로 daySchedule이 plan에 있는지 확인
    public DaySchedule findByPlanIdAndDayScheduleId(Long planId, Long dayScheduleId);
    
    // planId를 통해 그 plan 내부의 모든 daySchedule을 모음
    public List<DaySchedule> findByPlanId(Long planId);
}

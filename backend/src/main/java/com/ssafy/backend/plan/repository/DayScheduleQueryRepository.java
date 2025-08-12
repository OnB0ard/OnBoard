package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DaySchedule;

import java.util.List;
import java.util.Optional;

public interface DayScheduleQueryRepository {
    // planId와 dayScheduleId 두 개로 daySchedule이 plan에 있는지 확인 및 Lock
    Optional<DaySchedule> findByPlanIdAndDayScheduleId(Long planId, Long dayScheduleId);

    // GETMAPPING용 : planId와 dayScheduleId 두 개로 daySchedule이 plan에 있는지 확인 (Lock 없음!)
    Optional<DaySchedule> findByPlanIdAndDayScheduleIdNoLock(Long planId, Long dayScheduleId);

    // planId를 통해 그 plan 내부의 모든 daySchedule을 모음
    List<DaySchedule> findByPlanId(Long planId);
}

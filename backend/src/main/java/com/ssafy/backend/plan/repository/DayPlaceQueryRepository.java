package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DayPlace;

import java.util.List;
import java.util.Optional;

public interface DayPlaceQueryRepository {
    // 한 개의 plan방 내부에 있는 모든 여행지 조회
    List<DayPlace> getPlanScheduleByPlanId(Long planId);

    // planId 와 내부 ScheduleId로 한 날짜의 여행지를 조회 가능
    List<DayPlace> getDayScheduleByDayScheduleIdAndPlanId(Long dayScheduleId, Long planId);

    // planId와 dayScheduleId, dayPlaceId를 가지고 이 3가지가 한번에 묶여있는 row인지 + Lock
    Optional<DayPlace> findByPlanIdAndDayScheduleIdAndDayPlaceId(Long planId, Long dayScheduleId, Long dayPlaceId);
}

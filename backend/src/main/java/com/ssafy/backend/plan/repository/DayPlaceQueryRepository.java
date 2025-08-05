package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DayPlace;

import java.util.List;

public interface DayPlaceQueryRepository {
    List<DayPlace> getPlanScheduleByPlanId(long planId);
}

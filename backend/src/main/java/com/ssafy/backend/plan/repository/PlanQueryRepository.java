package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;

import java.util.List;

public interface PlanQueryRepository {
    List<Plan> findByWriter(Long userId);
    List<Plan> findPlansByUserId(Long userId);

}

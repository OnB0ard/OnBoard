package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;

import java.util.List;

public interface PlanQueryRepository {
    public List<Plan> findByWriter(Long userId);
}

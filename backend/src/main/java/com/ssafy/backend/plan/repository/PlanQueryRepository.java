package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.User;

import java.util.List;

public interface PlanQueryRepository {
    List<Plan> findByWriter(Long userId);
    List<Plan> findPlansByUser(User user);

}

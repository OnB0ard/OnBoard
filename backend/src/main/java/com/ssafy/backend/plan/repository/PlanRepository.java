package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepository extends JpaRepository<Plan, Long>, PlanQueryRepository {
}

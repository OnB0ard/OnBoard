package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface PlanRepository extends JpaRepository<Plan, Long>, PlanQueryRepository {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Plan p WHERE p.planId = :planId")
    Plan findByIdForUpdate(Long planId);
}

package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long>, PlanQueryRepository {
    // DaySchedule에서 등록, 삭제, 수정 시 DayOrder로 버그 일으킬 가능성 있으므로 Lock 걸고 조회.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Plan p WHERE p.planId = :planId")
    Optional<Plan> findByIdForUpdate(Long planId);
}

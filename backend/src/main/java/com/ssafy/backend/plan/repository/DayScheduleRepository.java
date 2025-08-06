package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DaySchedule;
import com.ssafy.backend.plan.entity.Plan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface DayScheduleRepository extends JpaRepository<DaySchedule,Long>, DayScheduleQueryRepository {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT COALESCE(MAX(d.dayOrder), 0) FROM DaySchedule d WHERE d.plan = :plan")
    Integer findMaxDayOrderByPlan(Plan plan);
}

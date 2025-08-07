package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DayPlace;
import com.ssafy.backend.plan.entity.DaySchedule;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface DayPlaceRepository extends JpaRepository<DayPlace, Long>, DayPlaceQueryRepository {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT COALESCE(MAX(dp.indexOrder), 0) FROM DayPlace dp WHERE dp.daySchedule = :daySchedule")
    Integer findMaxIndexOrderByDaySchedule(DaySchedule daySchedule);
}

package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.*;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class DayScheduleQueryRepositoryImpl implements DayScheduleQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Optional<DaySchedule> findByPlanIdAndDayScheduleId(Long planId, Long dayScheduleId) {
        QDaySchedule ds = QDaySchedule.daySchedule;
        QPlan p = QPlan.plan;

        DaySchedule daySchedule = queryFactory.selectFrom(ds)
                .join(ds.plan, p)
                .where(ds.dayScheduleId.eq(dayScheduleId)
                        .and(p.planId.eq(planId)))
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .fetchOne();
        return Optional.ofNullable(daySchedule);
    }

    public List<DaySchedule> findByPlanId(Long planId) {
        QDaySchedule ds = QDaySchedule.daySchedule;
        QPlan p = QPlan.plan;

        return queryFactory.selectFrom(ds)
                .join(ds.plan, p)
                .where(p.planId.eq(planId))
                .fetch();
    }
}

package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class DayScheduleQueryRepositoryImpl implements DayScheduleQueryRepository {

    private final JPAQueryFactory queryFactory;

    public DaySchedule findByPlanIdAndDayScheduleId(Long planId, Long dayScheduleId) {
        QDaySchedule ds = QDaySchedule.daySchedule;
        QPlan p = QPlan.plan;

        return queryFactory.selectFrom(ds)
                .join(ds.plan, p)
                .where(ds.dayScheduleId.eq(dayScheduleId)
                        .and(p.planId.eq(planId)))
                .fetchOne();
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

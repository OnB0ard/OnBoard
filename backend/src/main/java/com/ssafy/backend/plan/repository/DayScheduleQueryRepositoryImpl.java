package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.DaySchedule;
import com.ssafy.backend.plan.entity.QDaySchedule;
import com.ssafy.backend.plan.entity.QPlan;
import lombok.RequiredArgsConstructor;

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
}

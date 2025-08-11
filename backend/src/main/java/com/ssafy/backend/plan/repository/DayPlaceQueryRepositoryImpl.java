package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.place.entity.QPlace;
import com.ssafy.backend.plan.entity.DayPlace;
import com.ssafy.backend.plan.entity.QDayPlace;
import com.ssafy.backend.plan.entity.QDaySchedule;
import com.ssafy.backend.plan.entity.QPlan;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class DayPlaceQueryRepositoryImpl implements DayPlaceQueryRepository {
    private final JPAQueryFactory queryFactory;

    public List<DayPlace> getPlanScheduleByPlanId(Long planId)
    {
        QDayPlace dp = QDayPlace.dayPlace;
        QDaySchedule ds = QDaySchedule.daySchedule;
        QPlace p = QPlace.place;

        return queryFactory
                .selectFrom(dp)
                .join(dp.daySchedule, ds).fetchJoin()
                .join(dp.place, p).fetchJoin()
                .where(ds.plan.planId.eq(planId))
                .fetch();
    }

    public List<DayPlace> getDayScheduleByDayScheduleIdAndPlanId(Long dayScheduleId, Long planId)
    {
        QDayPlace dp = QDayPlace.dayPlace;
        QDaySchedule ds = QDaySchedule.daySchedule;
        QPlace p = QPlace.place;

        return queryFactory
                .selectFrom(dp)
                .join(dp.place, p).fetchJoin()
                .where(dp.daySchedule.dayScheduleId.eq(dayScheduleId).and(ds.plan.planId.eq(planId)))
                .fetch();
    }

    public DayPlace findByPlanIdAndDayScheduleIdAndDayPlaceId(Long planId, Long dayScheduleId, Long dayPlaceId)
    {
        QDayPlace dp = QDayPlace.dayPlace;
        QDaySchedule ds = QDaySchedule.daySchedule;
        QPlan p = QPlan.plan;

        DayPlace dayPlace = queryFactory.selectFrom(dp)
                .join(dp.daySchedule, ds)
                .join(ds.plan, p)
                .where(dp.dayPlaceId.eq(dayPlaceId)
                        .and(ds.dayScheduleId.eq(dayScheduleId))
                        .and(p.planId.eq(planId)))
                .fetchOne();

        return dayPlace;
    }
}

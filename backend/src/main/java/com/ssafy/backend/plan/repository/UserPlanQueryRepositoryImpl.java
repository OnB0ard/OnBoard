package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.QUser;
import com.ssafy.backend.user.entity.QUserPlan;
import com.ssafy.backend.user.entity.UserPlan;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class UserPlanQueryRepositoryImpl implements UserPlanQueryRepository {

    private final JPAQueryFactory queryFactory;

    public List<UserPlan> findAllWithUserByPlan(Plan plan) {
        QUserPlan up = QUserPlan.userPlan;
        QUser u = QUser.user;

        return queryFactory
                .selectFrom(up)
                .join(up.user, u).fetchJoin()
                .where(up.plan.eq(plan))
                .fetch();
    }
}

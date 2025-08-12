package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.QUser;
import com.ssafy.backend.user.entity.QUserPlan;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserType;
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

    @Override
    public Long findCreatorUserIdByPlan(Plan plan) {
        QUserPlan up = QUserPlan.userPlan;

        return queryFactory
                .select(up.user.userId)
                .from(up)
                .where(
                        up.plan.eq(plan),
                        up.userType.eq(UserType.CREATOR)
                )
                .fetchOne(); // 결과가 1개라는 전제
    }
}

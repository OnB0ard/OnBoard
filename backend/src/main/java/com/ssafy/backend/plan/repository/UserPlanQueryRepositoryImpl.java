package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.entity.QPlan;
import com.ssafy.backend.user.entity.*;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

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

    public List<Long> findCreatorPlanIdsByUserId(Long userId) {
        QUserPlan up = QUserPlan.userPlan;

        return queryFactory
                .select(up.plan.planId)
                .from(up)
                .where(
                        up.user.userId.eq(userId),
                        up.userType.eq(UserType.CREATOR)
                )
                .fetch();
    }

    public Optional<UserPlan> findCandidate(Long planId)
    {
        QUserPlan up = QUserPlan.userPlan;
        QPlan p = QPlan.plan;
        QUser u = QUser.user;

        UserPlan userPlan = queryFactory
                .selectFrom(up)
                .join(up.plan, p).fetchJoin()
                .join(up.user, u).fetchJoin()
                .where(
                        p.planId.eq(planId),
                        up.userType.eq(UserType.USER),
                        up.userStatus.eq(UserStatus.APPROVED)
                )
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .fetchFirst();

        return Optional.ofNullable(userPlan);
    }
}

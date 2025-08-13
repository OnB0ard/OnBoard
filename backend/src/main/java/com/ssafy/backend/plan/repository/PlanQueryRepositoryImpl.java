package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.entity.QPlan;
import com.ssafy.backend.user.entity.QUser;
import com.ssafy.backend.user.entity.QUserPlan;
import static com.ssafy.backend.plan.entity.QPlan.plan;
import static com.ssafy.backend.user.entity.QUserPlan.userPlan;

import com.ssafy.backend.user.entity.User;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class PlanQueryRepositoryImpl implements PlanQueryRepository {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<Plan> findPlansByUser(User user) {
        return jpaQueryFactory
                .select(plan)
                .from(userPlan)
                .join(userPlan.plan, plan)
                .where(userPlan.user.eq(user))
                .fetch();
    }

    public Plan lockPlan(Long planId) {
        QPlan p = QPlan.plan;
        return jpaQueryFactory.selectFrom(p)
                .where(p.planId.eq(planId))
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .fetchOne();
    }
}
package com.ssafy.backend.plan.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.entity.QPlan;
import com.ssafy.backend.user.entity.QUser;
import com.ssafy.backend.user.entity.QUserPlan;
import static com.ssafy.backend.plan.entity.QPlan.plan;
import static com.ssafy.backend.user.entity.QUserPlan.userPlan;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class PlanQueryRepositoryImpl implements PlanQueryRepository {

    private final JPAQueryFactory jpaQueryFactory;


    @Override
    public List<Plan> findByWriter(Long userId){
        QUser qUser = QUser.user;
        QUserPlan qUserPlan = QUserPlan.userPlan;
        QPlan qPlan = QPlan.plan;

        return jpaQueryFactory
                .selectFrom(qPlan)
                .join(qPlan.userPlans, qUserPlan).fetchJoin()
                .join(qUserPlan.user, qUser).fetchJoin()
                .where(qUser.userId.eq(userId))
                .fetch();
    }
    @Override
    public List<Plan> findPlansByUserId(Long userId) {
        return jpaQueryFactory
                .select(plan)
                .from(userPlan)
                .join(userPlan.plan, plan)
                .where(userPlan.user.userId.eq(userId))
                .fetch();
    }
}
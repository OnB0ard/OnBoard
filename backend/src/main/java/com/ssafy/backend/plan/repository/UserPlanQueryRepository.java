package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.UserPlan;

import java.util.List;

public interface UserPlanQueryRepository {
    // plan을 공유하는 모든 userPlan을 user와 먼저 fetchJoin하여 가져오는 메서드
    List<UserPlan> findAllWithUserByPlan(Plan plan);
    Long findCreatorUserIdByPlan(Plan plan);
}

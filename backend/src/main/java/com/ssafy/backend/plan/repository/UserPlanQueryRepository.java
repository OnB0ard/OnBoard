package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.UserPlan;

import java.util.List;
import java.util.Optional;

public interface UserPlanQueryRepository {
    // plan을 공유하는 모든 userPlan을 user와 먼저 fetchJoin하여 가져오는 메서드
    List<UserPlan> findAllWithUserByPlan(Plan plan);
    Long findCreatorUserIdByPlan(Plan plan);

    // deleteUser 할 때 사용
    List<Long> findCreatorPlanIdsByUserId(Long userId);

    // deleteUser시 다른 사람을 방장으로 만들기 위해 같은 여행방의 user 찾아오는 메서드 + LOCK
    Optional<UserPlan> findCandidate(Long planId);
}

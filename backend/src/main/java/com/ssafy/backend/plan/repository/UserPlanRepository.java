package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPlanRepository extends JpaRepository<UserPlan, Long>, UserPlanQueryRepository {
    // userPlan에 없는 사람이 사용(joinRequest), 있으면 status 분기로 예외 처리
    Optional<Object> findUserStatusByUserAndPlan(User user, Plan plan);

    // plan과 user를 통해 userPlan을 찾는 메서드
    Optional<UserPlan> findByPlanAndUser(Plan plan, User user);

    // plan과 user를 통해 userPlan 삭제
    void deleteByPlanAndUser(Plan plan, User user);


    boolean existsByPlanAndUser(Plan plan, User user);
    UserPlan getUserPlanByPlanAndUser(Plan plan, User user);
}
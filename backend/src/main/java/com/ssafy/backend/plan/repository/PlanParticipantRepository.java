package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanParticipantRepository extends JpaRepository<UserPlan, Long> {
    boolean existsByPlanAndUser(Plan plan, User user);
    UserPlan getUserPlanByPlanAndUser(Plan plan, User user);
}

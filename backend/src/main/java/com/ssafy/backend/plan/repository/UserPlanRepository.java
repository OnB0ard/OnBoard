package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPlanRepository extends JpaRepository<UserPlan, Long> {
    boolean existsByPlanAndUser(Plan plan, User user);
    UserPlan getUserPlanByPlanAndUser(Plan plan, User user);

    @Modifying
    @Query("DELETE FROM UserPlan up WHERE up.plan.planId = :planId AND up.user.userId = :userId")
    void deleteByPlanAndUser(@Param("planId") Long planId, @Param("userId") Long userId);
    boolean existsByPlan(Plan plan);
    boolean existsByUser(User user);
    void deleteUserPlanByPlanAndUser(Plan plan, User user);
}
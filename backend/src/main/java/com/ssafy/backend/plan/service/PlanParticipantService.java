package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.UserPlanExistException;
import com.ssafy.backend.plan.repository.PlanParticipantRepository;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.entity.UserType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlanParticipantService {

    private final PlanParticipantRepository planParticipantRepository;

    public boolean joinRequest(Long planId, Long userId)
    {
        UserPlan userPlan = new UserPlan();

        User user = new User();
        user.setUserId(userId);
        Plan plan = new Plan();
        plan.setPlanId(planId);

        if(planParticipantRepository.existsByPlanAndUser(plan, user)) {
            userPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, user);
            if (userPlan.getUserStatus() == UserStatus.PENDING) {
                throw new UserPlanExistException("이미 승인 대기 중입니다.");
            } else if (userPlan.getUserStatus() == UserStatus.APPROVED) {
                throw new UserPlanExistException("이미 여행의 구성원입니다.");
            }
        }

        userPlan.setUser(user);
        userPlan.setPlan(plan);
        userPlan.setUserType(UserType.USER);
        userPlan.setUserStatus(UserStatus.PENDING);

        planParticipantRepository.save(userPlan);
        return true;
    }
}

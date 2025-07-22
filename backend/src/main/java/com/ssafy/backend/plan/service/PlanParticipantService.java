package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.NotApplicantException;
import com.ssafy.backend.plan.exception.NotInThisRoomException;
import com.ssafy.backend.plan.exception.UserCannotApproveException;
import com.ssafy.backend.plan.exception.UserPlanExistException;
import com.ssafy.backend.plan.repository.PlanParticipantRepository;
import com.ssafy.backend.security.dto.JwtUserInfo;
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

    public boolean joinRequest(Long planId, JwtUserInfo jwtUserInfo) {
        UserPlan userPlan = new UserPlan();

        Plan plan = new Plan();
        // TODO : if > planID 가 없으면? > Exception
        plan.setPlanId(planId);

        // 여기서 유저는 "사용자"이다.
        User user = new User();
        // TODO : if > token이 null이면? > Exception
        user.setUserId(jwtUserInfo.getUserId());

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

    public boolean approveRequest(Long planId, Long userId, JwtUserInfo jwtUserInfo) {
        UserPlan deciderPlan = new UserPlan();

        Plan plan = new Plan();
        // TODO : if > planID 가 없으면? > Exception
        plan.setPlanId(planId);

        User decider = new User();
        // TODO : if > token이 null이면? > Exception
        decider.setUserId(jwtUserInfo.getUserId());

        System.out.println(plan.getPlanId());
        System.out.println(decider.getUserId());

        if(!planParticipantRepository.existsByPlanAndUser(plan, decider)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        deciderPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, decider);

        if(deciderPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        } // else if 작성 안하고, 생성자라고 생각 함

        User applicant = new User();
        // TODO : if > userID가 없는 사람이면 > Exception
        applicant.setUserId(userId);

        if(!planParticipantRepository.existsByPlanAndUser(plan, applicant)) {
            throw new NotApplicantException("참여 요청을 하지 않은 사용자입니다.");
        }

        UserPlan applicantPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, applicant);
        applicantPlan.setUserStatus(UserStatus.APPROVED);
        planParticipantRepository.save(applicantPlan);

        return true;
    }


}

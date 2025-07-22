package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.*;
import com.ssafy.backend.plan.repository.UserPlanRepository;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.entity.UserType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanParticipantService {

    private final UserPlanRepository planParticipantRepository;

    @Transactional
    public boolean joinRequest(Long planId, JwtUserInfo jwtUserInfo) {

        UserPlan userPlan = new UserPlan();

        Plan plan = new Plan();
        plan.setPlanId(planId);
        if(!planParticipantRepository.existsByPlan(plan)){
            throw new PlanNotExistException("여행 계획이 존재하지 않습니다.");
        }

        User user = new User();
        user.setUserId(jwtUserInfo.getUserId());
        if(!planParticipantRepository.existsByUser(user)){
            throw new UserNotExistException("사용자가 존재하지 않습니다.");
        }

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

    @Transactional
    public boolean approveRequest(Long planId, Long userId, JwtUserInfo jwtUserInfo) {

        UserPlan creatorPlan = new UserPlan();

        Plan plan = new Plan();
        plan.setPlanId(planId);
        if(!planParticipantRepository.existsByPlan(plan)){
            throw new PlanNotExistException("여행 계획이 존재하지 않습니다.");
        }

        User creator = new User();
        creator.setUserId(jwtUserInfo.getUserId());
        if(!planParticipantRepository.existsByUser(creator)){
            throw new UserNotExistException("사용자가 존재하지 않습니다.");
        }

        if(!planParticipantRepository.existsByPlanAndUser(plan, creator)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        creatorPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, creator);

        if(creatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        } // else if 작성 안하고, 생성자라고 생각 함

        User applicant = new User();
        applicant.setUserId(userId);
        if(!planParticipantRepository.existsByUser(applicant)){
            throw new UserNotExistException("이 사용자는 존재하지 않습니다.");
        }

        if(!planParticipantRepository.existsByPlanAndUser(plan, applicant)) {
            throw new NotApplicantException("참여 요청을 하지 않은 사용자입니다.");
        }

        UserPlan applicantPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, applicant);
        applicantPlan.setUserStatus(UserStatus.APPROVED);
        planParticipantRepository.save(applicantPlan);

        return true;
    }

    @Transactional
    public boolean denyRequest(Long planId, Long userId, JwtUserInfo jwtUserInfo) {
        UserPlan creatorPlan = new UserPlan();

        Plan plan = new Plan();
        plan.setPlanId(planId);
        if(!planParticipantRepository.existsByPlan(plan)){
            throw new PlanNotExistException("여행 계획이 존재하지 않습니다.");
        }

        User creator = new User();
        creator.setUserId(jwtUserInfo.getUserId());
        if(!planParticipantRepository.existsByUser(creator)){
            throw new UserNotExistException("사용자가 존재하지 않습니다.");
        }

        if(!planParticipantRepository.existsByPlanAndUser(plan, creator)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        creatorPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, creator);

        if(creatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        } // else if 작성 안하고, 생성자라고 생각 함

        User applicant = new User();
        applicant.setUserId(userId);
        if(!planParticipantRepository.existsByUser(applicant)){
            throw new UserNotExistException("이 사용자는 존재하지 않습니다.");
        }

        if(!planParticipantRepository.existsByPlanAndUser(plan, applicant)) {
            throw new NotApplicantException("참여 요청을 하지 않은 사용자입니다.");
        }

        planParticipantRepository.deleteUserPlanByPlanAndUser(plan, applicant);
        return true;
    }

    @Transactional
    public boolean delegateRequest(Long planId, Long userId, JwtUserInfo jwtUserInfo) {
        UserPlan delegatorPlan = new UserPlan();

        Plan plan = new Plan();
        plan.setPlanId(planId);
        if(!planParticipantRepository.existsByPlan(plan)){
            throw new PlanNotExistException("여행 계획이 존재하지 않습니다.");
        }

        User delegator = new User();
        delegator.setUserId(jwtUserInfo.getUserId());
        if(!planParticipantRepository.existsByUser(delegator)){
            throw new UserNotExistException("사용자가 존재하지 않습니다.");
        }

        if (!planParticipantRepository.existsByPlanAndUser(plan, delegator)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        delegatorPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, delegator);

        if (delegatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        } // else if 작성 안하고, 생성자라고 생각 함

        User user = new User();
        user.setUserId(userId);
        if(!planParticipantRepository.existsByUser(user)){
            throw new UserNotExistException("이 사용자는 존재하지 않습니다.");
        }

        if(!planParticipantRepository.existsByPlanAndUser(plan, user)) {
            throw new NotApplicantException("참여 요청을 하지 않은 사용자입니다.");
        }

        UserPlan userPlan = planParticipantRepository.getUserPlanByPlanAndUser(plan, user);
        userPlan.setUserType(UserType.CREATOR);
        planParticipantRepository.save(userPlan);

        delegatorPlan.setUserType(UserType.USER);
        planParticipantRepository.save(delegatorPlan);
        
        return true;
    }
}

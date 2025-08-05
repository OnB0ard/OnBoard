package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.dto.request.AcceptOrDenyUserRequestDTO;
import com.ssafy.backend.plan.dto.response.UserStatusResponseDTO;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.*;
import com.ssafy.backend.plan.repository.PlanRepository;
import com.ssafy.backend.plan.repository.UserPlanRepository;
import com.ssafy.backend.plan.dto.response.CreatorResponseDTO;
import com.ssafy.backend.plan.dto.response.ParticipantResponseDTO;
import com.ssafy.backend.plan.dto.response.PlanParticipantUserListResponseDTO;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.entity.UserType;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanParticipantService {

    private final UserPlanRepository userPlanRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;

    @Transactional
    public boolean joinRequest(Long planId, JwtUserInfo jwtUserInfo) {

        UserPlan userPlan = new UserPlan();

        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(jwtUserInfo.getUserId());

        if(userPlanRepository.existsByPlanAndUser(plan, user)) {
            userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
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

        userPlanRepository.save(userPlan);
        return true;
    }

    @Transactional
    public boolean approveRequest(Long planId, AcceptOrDenyUserRequestDTO acceptOrDenyUserRequestDTO, JwtUserInfo jwtUserInfo) {

        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(acceptOrDenyUserRequestDTO.getUserId());
        User creator = validateUserExistence(jwtUserInfo.getUserId());

        if(!userPlanRepository.existsByPlanAndUser(plan, creator)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        UserPlan creatorPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, creator);

        if(creatorPlan.getUserType() == UserType.USER) {
            // 대기자(PENDING)도 구분해서 넣어야 해? 그럴 필요까지 없다고 생각해서 안나눔
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        } // else if 작성 안하고, 생성자라고 생각 함

        User applicant = new User();
        applicant.setUserId(acceptOrDenyUserRequestDTO.getUserId());
        if(!userPlanRepository.existsByUser(applicant)){
            throw new UserNotExistException("이 사용자는 존재하지 않습니다.");
        }

        if(!userPlanRepository.existsByPlanAndUser(plan, applicant)) {
            throw new NotApplicantException("참여 요청을 하지 않은 사용자입니다.");
        }

        UserPlan applicantPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, applicant);
        applicantPlan.setUserStatus(UserStatus.APPROVED);
        userPlanRepository.save(applicantPlan);

        return true;
    }

    @Transactional
    public boolean denyRequest(Long planId, AcceptOrDenyUserRequestDTO acceptOrDenyUserRequestDTO, JwtUserInfo jwtUserInfo) {

        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(acceptOrDenyUserRequestDTO.getUserId());
        User creator = validateUserExistence(jwtUserInfo.getUserId());

        if(!userPlanRepository.existsByPlanAndUser(plan, creator)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        UserPlan creatorPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, creator);

        if(creatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        } // else if 작성 안하고, 생성자라고 생각 함

        User applicant = new User();
        applicant.setUserId(acceptOrDenyUserRequestDTO.getUserId());
        if(!userPlanRepository.existsByUser(applicant)){
            throw new UserNotExistException("이 사용자는 존재하지 않습니다.");
        }

        if(!userPlanRepository.existsByPlanAndUser(plan, applicant)) {
            throw new NotApplicantException("참여 요청을 하지 않은 사용자입니다.");
        }

        userPlanRepository.deleteUserPlanByPlanAndUser(plan, applicant);
        return true;
    }

    public PlanParticipantUserListResponseDTO getUserList(Long planId, JwtUserInfo jwtUserInfo) {

        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(jwtUserInfo.getUserId());

        if(!userPlanRepository.existsByPlanAndUser(plan, user)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        UserPlan userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
        if(userPlan.getUserStatus().equals(UserStatus.PENDING)) {
            throw new PendingUserException("당신이 아직 초대되지 않은 방입니다.");
        }


        List<UserPlan> userPlanList = userPlanRepository.findAllUserPlanByPlan(plan);
        List<ParticipantResponseDTO> participantListDTO = new ArrayList<>();
        CreatorResponseDTO creatorResponseDTO = new CreatorResponseDTO();

        for(UserPlan up : userPlanList){
            if(up.getUserType() == UserType.CREATOR) {
                User c = up.getUser();
                creatorResponseDTO = CreatorResponseDTO.builder()
                        .userId(c.getUserId())
                        .userName(c.getUserName())
                        .googleEmail(c.getGoogleEmail())
                        .profileImage(c.getProfileImage())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        .userStatus(up.getUserStatus())
                        .build();
            } else {
                User p = up.getUser();

                ParticipantResponseDTO participantResponseDTO = ParticipantResponseDTO.builder()
                        .userId(p.getUserId())
                        .userName(p.getUserName())
                        .googleEmail(p.getGoogleEmail())
                        .profileImage(p.getProfileImage())
                        .createdAt(p.getCreatedAt())
                        .updatedAt(p.getUpdatedAt())
                        .userType(up.getUserType())
                        .userStatus(up.getUserStatus())
                        .build();

                participantListDTO.add(participantResponseDTO);
            }
        }

        return PlanParticipantUserListResponseDTO.builder()
                .creator(creatorResponseDTO)
                .userlist(participantListDTO)
                .build();
    }

    @Transactional
    public boolean delegateRequest(Long planId, Long userId, JwtUserInfo jwtUserInfo) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        User delegator = validateUserExistence(jwtUserInfo.getUserId());

        if (!userPlanRepository.existsByPlanAndUser(plan, delegator)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        UserPlan delegatorPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, delegator);

        if (delegatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        } // else if 작성 안하고, 생성자라고 생각 함

        if (!userPlanRepository.existsByPlanAndUser(plan, user)) {
            throw new NotApplicantException("참여 요청을 하지 않은 사용자입니다.");
        }

        UserPlan userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
        userPlan.setUserType(UserType.CREATOR);
        userPlanRepository.save(userPlan);

        delegatorPlan.setUserType(UserType.USER);
        userPlanRepository.save(delegatorPlan);

        return true;
    }

    public UserStatusResponseDTO getUserStatus(Long planId, Long userId) {

        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));

        return UserStatusResponseDTO.builder()
                .userStatus(userPlan.getUserStatus())
                .build();
    }

    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }

    private Plan validatePlanExistence(Long planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotExistException("존재하지 않는 계획입니다. planId=" + planId));
    }
}
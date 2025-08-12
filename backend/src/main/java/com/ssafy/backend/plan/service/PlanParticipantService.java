package com.ssafy.backend.plan.service;

import com.ssafy.backend.common.util.S3Util;
import com.ssafy.backend.plan.dto.request.UserIdRequestDTO;
import com.ssafy.backend.plan.dto.response.UserInformationResponseDTO;
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
    private final S3Util s3Util;

    @Transactional
    public boolean joinRequest(Long planId, JwtUserInfo jwtUserInfo) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(jwtUserInfo.getUserId());

        userPlanRepository.findUserStatusByUserAndPlan(user, plan)
                .ifPresent(status -> {
                    throw new UserPlanExistException(
                            status == UserStatus.PENDING ? "이미 승인 대기 중입니다." : "이미 여행의 구성원입니다."
                    );
                });

        UserPlan userPlan = UserPlan.builder()
                .user(user)
                .plan(plan)
                .userType(UserType.USER)
                .userStatus(UserStatus.PENDING)
                .build();

        userPlanRepository.save(userPlan);
        return true;
    }

    @Transactional
    public boolean approveRequest(Long planId, UserIdRequestDTO userIdRequestDTO, JwtUserInfo jwtUserInfo) {
        Plan plan = validatePlanExistence(planId);
        User creator = validateUserExistence(jwtUserInfo.getUserId());
        User applicant = validateUserExistence(userIdRequestDTO.getUserId());

        UserPlan creatorPlan = userPlanRepository.findByPlanAndUser(plan, creator)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (creatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        }

        UserPlan applicantPlan = userPlanRepository.findByPlanAndUser(plan, applicant)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방에 참여 신청한 적이 없습니다."));
        if (applicantPlan.getUserStatus() == UserStatus.APPROVED) {
            throw new AlreadyApprovedException("이미 방에 참여된 사용자입니다.");
        }

        applicantPlan.setUserStatus(UserStatus.APPROVED);
        return true;
    }

    @Transactional
    public boolean denyRequest(Long planId, UserIdRequestDTO userIdRequestDTO, JwtUserInfo jwtUserInfo) {
        Plan plan = validatePlanExistence(planId);
        User creator = validateUserExistence(jwtUserInfo.getUserId());
        User applicant = validateUserExistence(userIdRequestDTO.getUserId());

        UserPlan creatorPlan = userPlanRepository.findByPlanAndUser(plan, creator)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (creatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        }

        UserPlan applicantPlan = userPlanRepository.findByPlanAndUser(plan, applicant)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방에 참여 신청한 적이 없습니다."));
        if (applicantPlan.getUserStatus() == UserStatus.APPROVED) {
            throw new AlreadyApprovedException("이미 방에 참여된 사용자입니다.");
        }

        userPlanRepository.deleteByPlanAndUser(plan, applicant);
        return true;
    }

    public PlanParticipantUserListResponseDTO getUserList(Long planId, JwtUserInfo jwtUserInfo) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(jwtUserInfo.getUserId());

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new PendingUserException("당신이 아직 초대되지 않은 방입니다.");
        }

        List<UserPlan> userPlanList = userPlanRepository.findAllWithUserByPlan(plan);
        List<ParticipantResponseDTO> participantListDTO = new ArrayList<>();
        CreatorResponseDTO creatorResponseDTO = new CreatorResponseDTO();

        for(UserPlan up : userPlanList){
            if(up.getUserType() == UserType.CREATOR) {
                User c = up.getUser();
                creatorResponseDTO = CreatorResponseDTO.builder()
                        .userId(c.getUserId())
                        .userName(c.getUserName())
                        .googleEmail(c.getGoogleEmail())
                        .profileImage(c.getProfileImage() != null ? s3Util.getUrl(c.getProfileImage()) : null)
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
                        .profileImage(p.getProfileImage() != null ? s3Util.getUrl(p.getProfileImage()) : null)
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
    public boolean delegateRequest(Long planId, UserIdRequestDTO userIdRequestDTO, JwtUserInfo jwtUserInfo) {
        Plan plan = validatePlanExistence(planId);
        User creator = validateUserExistence(jwtUserInfo.getUserId());
        User user = validateUserExistence(userIdRequestDTO.getUserId());

        UserPlan creatorPlan = userPlanRepository.findByPlanAndUser(plan, creator)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (creatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        }

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new PendingUserException("당신이 아직 초대되지 않은 방입니다.");
        }

        userPlan.setUserType(UserType.CREATOR);
        creatorPlan.setUserType(UserType.USER);
        return true;
    }

    public UserInformationResponseDTO getUserInformation(Long planId, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));

        return UserInformationResponseDTO.builder()
                .userStatus(userPlan.getUserStatus())
                .userType(userPlan.getUserType())
                .build();
    }

    @Transactional
    public boolean resignRequest(Long planId, UserIdRequestDTO userIdRequestDTO, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User creator = validateUserExistence(userId);
        User user = validateUserExistence(userIdRequestDTO.getUserId());

        UserPlan creatorPlan = userPlanRepository.findByPlanAndUser(plan, creator)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (creatorPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 권한이 없습니다.");
        }

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new PendingUserException("당신이 아직 초대되지 않은 방입니다.");
        }

        userPlanRepository.delete(userPlan);
        return true;
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
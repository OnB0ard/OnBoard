package com.ssafy.backend.plan.service;

import com.ssafy.backend.common.exception.S3UploadFailedException;
import com.ssafy.backend.common.util.S3Util;
import com.ssafy.backend.plan.dto.request.CreatePlanRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdatePlanRequestDTO;
import com.ssafy.backend.plan.dto.response.CreatePlanResponseDTO;
import com.ssafy.backend.plan.dto.response.RetrievePlanResponse;
import com.ssafy.backend.plan.dto.response.UpdatePlanResponseDTO;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.CreatorCannotLeaveException;
import com.ssafy.backend.plan.exception.PlanNotExistException;
import com.ssafy.backend.plan.exception.UserCannotApproveException;
import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.plan.repository.PlanRepository;
import com.ssafy.backend.plan.repository.UserPlanRepository;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserType;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanService {
    private final S3Util s3Util;
    private final PlanRepository planRepository;
    private final UserPlanRepository userPlanRepository;
    private final UserRepository userRepository;

    @Transactional
    public CreatePlanResponseDTO createPlan(Long userId, CreatePlanRequestDTO createPlanRequestDTO, MultipartFile image) throws IOException {
        User user = validateUserExistence(userId);

        String imageKey = null;
        if (image != null && !image.isEmpty()) {

            String fileName = "plans/" + System.currentTimeMillis() + "_" + image.getOriginalFilename();
            boolean uploaded = s3Util.putObject(fileName, image.getInputStream(), image.getContentType());

            if (uploaded) {
                imageKey = fileName;
            } else {
                throw new S3UploadFailedException("S3 업로드 실패하였습니다.");
            }
        }
        Plan plan = Plan.builder()
                .planName(createPlanRequestDTO.getName())
                .planDescription(createPlanRequestDTO.getDescription())
                .startDate(createPlanRequestDTO.getStartDate())
                .endDate(createPlanRequestDTO.getEndDate())
                .planImage(imageKey)
                .hashTag(createPlanRequestDTO.getHashTag())
                .build();

        planRepository.save(plan);
        // user_plan 생성


        UserPlan userPlan = UserPlan.builder()
                .user(user)
                .plan(plan)
                .userType(UserType.CREATOR)
                .build();

        userPlanRepository.save(userPlan);


        return CreatePlanResponseDTO.builder()
                .planId(plan.getPlanId())
                .name(plan.getPlanName())
                .description(plan.getPlanDescription())
                .startDate(plan.getStartDate().toString())
                .endDate(plan.getEndDate().toString())
                .hashTag(plan.getHashTag())
                .imageUrl(imageKey != null ? s3Util.getUrl(imageKey) : null)
                .build();
    }

    @Transactional
    public UpdatePlanResponseDTO updatePlan(Long userId, Long planId, UpdatePlanRequestDTO updatePlanReq, MultipartFile image) throws IOException {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);
        UserPlan  updateUserPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);

        //방을 업데이트할 수 있는 사람인지 확인
        if(updateUserPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 업데이트할 권한이 없습니다.");
        }


        String imageKey = plan.getPlanImage();
        if (updatePlanReq.isImageModified()) {
            // 기존 이미지가 있으면 삭제
            if (imageKey != null && !imageKey.isEmpty()) {
                s3Util.deleteObject(imageKey);
                imageKey = null; // 초기화
            }

            // 새 이미지가 들어온 경우 업로드
            if (image != null && !image.isEmpty()) {
                String newFileName = "plans/" + System.currentTimeMillis() + "_" + image.getOriginalFilename();
                boolean uploaded = s3Util.putObject(newFileName, image.getInputStream(), image.getContentType());

                if (!uploaded) {
                    throw new S3UploadFailedException("S3 업로드 실패");
                }

                imageKey = newFileName;
            }

            plan.setPlanImage(imageKey); // 새 키 or null
        }

        plan.setPlanName(updatePlanReq.getName());
        plan.setPlanDescription(updatePlanReq.getDescription());
        plan.setStartDate(updatePlanReq.getStartDate());
        plan.setEndDate(updatePlanReq.getEndDate());
        plan.setHashTag(updatePlanReq.getHashTag());

        return UpdatePlanResponseDTO.builder()
                .planId(plan.getPlanId())
                .name(plan.getPlanName())
                .description(plan.getPlanDescription())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .hashTag(plan.getHashTag())
                .imageUrl(imageKey != null ? s3Util.getUrl(imageKey) : null)
                .build();
    }

    @Transactional
    public void deletePlan(Long userId, Long planId) {
        // 존재 여부 확인
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        // 권한 확인 (방 생성자만 삭제 가능하도록)
        UserPlan userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
        if (userPlan.getUserType() == UserType.USER) {
            throw new UserCannotApproveException("참여자에게는 삭제 권한이 없습니다.");
        }
        String imageKey = plan.getPlanImage();
        if (imageKey != null && !imageKey.isBlank()) {
            s3Util.deleteObject(imageKey); // 방을 만들때 만든 사진을 삭제한다.
        }
        planRepository.delete(plan);


    }

    public List<RetrievePlanResponse> retrievePlanList(Long userId) {
        User user = validateUserExistence(userId);
        List<Plan> plansByUser = planRepository.findPlansByUser(user);

        List<RetrievePlanResponse> planResponses = plansByUser.stream().map(plan ->
            RetrievePlanResponse.builder()
                    .planId(plan.getPlanId())
                    .name(plan.getPlanName())
                    .description(plan.getPlanDescription())
                    .startDate(plan.getStartDate())
                    .endDate(plan.getEndDate())
                    .hashTag(plan.getHashTag())
                    .imageUrl(plan.getPlanImage() != null ? s3Util.getUrl(plan.getPlanImage()) : null)
                    .build()
        ).toList();
        return planResponses;
    }

    @Transactional
    public void leavePlan(Long userId, Long planId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
        if (userPlan.getUserType() == UserType.CREATOR) {
            throw new CreatorCannotLeaveException("방 생성자는 나갈 수 없습니다.");
        }
        userPlanRepository.deleteByPlanAndUser(plan, user);
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
